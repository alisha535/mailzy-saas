import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'

// ── Configuration ──────────────────────────────────────────────────────────
const BATCH_SIZE = 50 // Max emails to process per run
const MAX_RETRIES = 3

// ── Security: Decryption Utility ───────────────────────────────────────────
// Expects an AES-GCM encrypted base64 string where the first 12 bytes are the IV
async function decryptPassword(encryptedBase64: string, keyString: string): Promise<string> {
  if (!encryptedBase64) return '';
  if (!keyString || keyString.length === 0) {
    console.warn("No SMTP_ENCRYPTION_KEY found. Using raw password (NOT SECURE).");
    return encryptedBase64;
  }
  
  try {
    const keyBuffer = new TextEncoder().encode(keyString.padEnd(32, '0').slice(0, 32));
    const key = await crypto.subtle.importKey(
      'raw', keyBuffer, { name: 'AES-GCM' }, false, ['decrypt']
    );
    
    const encryptedBytes = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const iv = encryptedBytes.slice(0, 12);
    const data = encryptedBytes.slice(12);
    
    const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(decryptedBuffer);
  } catch (e) {
    console.error("Decryption failed. Falling back to raw string. Err:", e);
    return encryptedBase64;
  }
}

serve(async (req) => {
  // 1. Initialize Supabase Admin Client (bypasses RLS)
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const encryptionKey = Deno.env.get('SMTP_ENCRYPTION_KEY') ?? ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 2. Fetch pending emails atomically using the new RPC function
    // This locks the rows and sets them to PROCESSING so no other worker grabs them.
    const { data: queueJson, error: rpcError } = await supabase.rpc('process_email_queue_batch', { batch_size: BATCH_SIZE })
    
    if (rpcError) throw rpcError;
    
    // Parse the JSON array returned by the RPC
    const queue = typeof queueJson === 'string' ? JSON.parse(queueJson) : queueJson;

    if (!queue || queue.length === 0) {
      return new Response(JSON.stringify({ message: 'Queue is empty' }), { status: 200 })
    }

    const results = [];

    // 3. Group emails by SMTP Account to pool connections
    const accountsMap = new Map();
    for (const email of queue) {
      const accountKey = email.smtp_account?.username || 'unknown';
      if (!accountsMap.has(accountKey)) {
        accountsMap.set(accountKey, { smtp: email.smtp_account, emails: [] });
      }
      accountsMap.get(accountKey).emails.push(email);
    }

    // 4. Process each account block
    for (const [accountKey, accountData] of accountsMap.entries()) {
      const { smtp, emails } = accountData;

      if (!smtp || !smtp.host) {
        // Mark all as failed if no valid SMTP
        for (const email of emails) {
          await markFailed(supabase, email, new Error('No valid SMTP configuration found'));
          results.push({ id: email.id, status: 'FAILED' });
        }
        continue;
      }

      const client = new SmtpClient();
      let isConnected = false;

      try {
        // Decrypt password
        const plainPassword = await decryptPassword(smtp.password_enc, encryptionKey);

        // Connect ONCE for all emails in this account's batch
        await client.connectTLS({
          hostname: smtp.host,
          port: smtp.port || 465,
          username: smtp.username,
          password: plainPassword,
        });
        isConnected = true;

        for (const email of emails) {
          try {
            // Send Email
            await client.send({
              from: email.from_email || smtp.email,
              to: email.to_email,
              replyTo: email.reply_to || email.from_email,
              subject: email.subject,
              content: email.body_text || 'Please view this email in an HTML-compatible client.',
              html: email.body_html,
            });

            // Update Status to SENT
            await supabase
              .from('email_queue')
              .update({ 
                status: 'SENT', 
                sent_at: new Date().toISOString(),
                error_message: null
              })
              .eq('id', email.id);
              
            results.push({ id: email.id, status: 'SENT' });
          } catch (sendErr) {
            console.error(`Failed to send email ${email.id}:`, sendErr);
            await markFailed(supabase, email, sendErr);
            results.push({ id: email.id, status: 'FAILED' });
          }
        }
      } catch (connErr) {
        console.error(`Failed to connect to SMTP for account ${accountKey}:`, connErr);
        for (const email of emails) {
          await markFailed(supabase, email, connErr);
          results.push({ id: email.id, status: 'FAILED' });
        }
      } finally {
        if (isConnected) {
          await client.close();
        }
      }
    }

    return new Response(
      JSON.stringify({ message: 'Batch processed', results }), 
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Fatal Error processing queue:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to handle retry counts and failures
async function markFailed(supabase: any, email: any, err: any) {
  const retryCount = (email.retry_count || 0) + 1;
  const isPermFail = retryCount >= MAX_RETRIES;

  await supabase
    .from('email_queue')
    .update({ 
      status: isPermFail ? 'PERMANENTLY_FAILED' : 'FAILED',
      retry_count: retryCount,
      error_message: err.message || 'Unknown SMTP error'
    })
    .eq('id', email.id);
}
