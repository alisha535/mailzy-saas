// ── Email Queue Service — Queues emails for the email-worker Edge Function ──
import { supabase } from './supabase'
import { interpolate } from './utils'

/**
 * Adds emails to the email_queue table.
 * The Supabase email-worker Edge Function processes this queue.
 *
 * @param {object} campaign - The campaign object with steps, smtp_account_id etc.
 * @param {Array}  leads    - Array of lead objects to send to
 */
export async function queueCampaignEmails(campaign, leads) {
  if (!campaign?.campaign_steps?.length) throw new Error('Campaign has no steps configured')
  if (!leads?.length) throw new Error('No leads to send to')
  if (!campaign.smtp_account_id) throw new Error('No SMTP account selected for this campaign')

  const step = campaign.campaign_steps[0] // Start with step 1
  const now  = new Date()

  const emailRows = leads
    .filter(l => l.email && !l.unsubscribed)
    .map(lead => {
      const vars = {
        firstName:  lead.first_name || '',
        lastName:   lead.last_name  || '',
        company:    lead.company    || '',
        email:      lead.email,
        fullName:   `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
      }

      // Personalize subject and body
      const subject  = interpolate(step.subject, vars)
      const bodyText = interpolate(step.body, vars)
      const bodyHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;font-size:15px;line-height:1.6;color:#222;">
        ${bodyText.split('\n').filter(Boolean).map(p => `<p style="margin:0 0 12px;">${p}</p>`).join('')}
      </div>`

      // Schedule with delay if set
      const scheduledAt = new Date(now.getTime() + (step.delay_days || 0) * 86400000)

      return {
        workspace_id:     campaign.workspace_id,
        smtp_account_id:  campaign.smtp_account_id,
        campaign_id:      campaign.id,
        campaign_step_id: step.id,
        lead_id:          lead.id,
        to_email:         lead.email,
        to_name:          vars.fullName,
        from_email:       campaign.from_email,
        from_name:        campaign.from_name,
        subject,
        body_html:        bodyHtml,
        body_text:        bodyText,
        status:           'PENDING',
        scheduled_at:     scheduledAt.toISOString(),
      }
    })

  if (!emailRows.length) throw new Error('All leads are unsubscribed')

  // Insert in chunks of 100 to avoid payload limits
  const CHUNK = 100
  let totalQueued = 0
  for (let i = 0; i < emailRows.length; i += CHUNK) {
    const { data, error } = await supabase
      .from('email_queue')
      .insert(emailRows.slice(i, i + CHUNK))
      .select('id')
    if (error) throw new Error(`Failed to queue emails: ${error.message}`)
    totalQueued += data?.length ?? 0
  }

  // Update campaign total_leads count
  await supabase
    .from('campaigns')
    .update({ total_leads: totalQueued, status: 'ACTIVE' })
    .eq('id', campaign.id)

  return totalQueued
}

/**
 * Triggers the email-worker Edge Function manually.
 * In production, this is triggered via a Supabase cron job every 5 minutes.
 */
export async function triggerEmailWorker() {
  const { data, error } = await supabase.functions.invoke('email-worker', {
    body: { trigger: 'manual' }
  })
  if (error) throw new Error(`Worker error: ${error.message}`)
  return data
}

/**
 * Gets queue stats for a workspace
 */
export async function getQueueStats(workspaceId) {
  const { data, error } = await supabase
    .from('email_queue')
    .select('status', { count: 'exact' })
    .eq('workspace_id', workspaceId)

  if (error) return { pending: 0, sent: 0, failed: 0 }

  const counts = { PENDING: 0, PROCESSING: 0, SENT: 0, FAILED: 0, PERMANENTLY_FAILED: 0 }
  data?.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++ })

  return {
    pending: counts.PENDING + counts.PROCESSING,
    sent:    counts.SENT,
    failed:  counts.FAILED + counts.PERMANENTLY_FAILED,
  }
}
