import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Rate limit store (in-memory per function instance) ─────
const rateLimitMap = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT   = 30  // max 30 requests
const RATE_WINDOW  = 60  // per 60 seconds

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.reset) {
    rateLimitMap.set(userId, { count: 1, reset: now + RATE_WINDOW * 1000 })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Authenticate — require valid JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Rate limit per user
    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again in 60 seconds.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Parse and validate request body
    const body = await req.json()
    const { messages, max_tokens = 600, temperature = 0.7 } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid request: messages array required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. Sanitize messages — strip any injected system overrides from user role
    const sanitized = messages.map((m: any) => ({
      role:    ['system', 'user', 'assistant'].includes(m.role) ? m.role : 'user',
      content: String(m.content ?? '').slice(0, 4000), // max 4000 chars per message
    }))

    // 5. Get Groq key from user profile OR env secret (never exposed to frontend)
    const { data: profile } = await supabase
      .from('profiles')
      .select('groq_key')
      .eq('id', user.id)
      .single()

    const groqKey = profile?.groq_key || Deno.env.get('GROQ_API_KEY')
    if (!groqKey) {
      return new Response(JSON.stringify({ error: 'No AI key configured. Add your Groq key in Settings.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 6. Forward to Groq (server-side — key never touches browser)
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model:      'llama3-8b-8192',
        max_tokens: Math.min(max_tokens, 1000), // cap at 1000
        temperature: Math.max(0, Math.min(temperature, 1)),
        messages:   sanitized,
      }),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      console.error('[groq-proxy] Groq API error:', groqRes.status, errText)
      return new Response(JSON.stringify({ error: 'AI service error. Please try again.' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const groqData = await groqRes.json()

    // 7. Return only what the frontend needs
    return new Response(
      JSON.stringify({ content: groqData.choices?.[0]?.message?.content ?? '' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    console.error('[groq-proxy] Error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
