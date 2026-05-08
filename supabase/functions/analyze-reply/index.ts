import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { event_id, email_body } = await req.json()

    // 1. Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 2. Call fast LLM (e.g., Claude Haiku) for intent categorization
    // Mocking intent categorization logic:
    let intent = 'unknown'
    const lowerBody = email_body.toLowerCase()
    if (lowerBody.includes('unsubscribe') || lowerBody.includes('stop')) {
      intent = 'not_interested'
    } else if (lowerBody.includes('meeting') || lowerBody.includes('call') || lowerBody.includes('time')) {
      intent = 'meeting_booked'
    } else if (lowerBody.includes('interested') || lowerBody.includes('tell me more')) {
      intent = 'interested'
    } else {
      intent = 'question'
    }

    // 3. Update Email Event
    const { error: updateError } = await supabaseClient
      .from('email_events')
      .update({ ai_intent_tag: intent })
      .eq('id', event_id)

    if (updateError) throw updateError

    // 4. (Optional) Trigger Make.com / Zapier webhook if intent == 'meeting_booked'
    if (intent === 'meeting_booked') {
        // await fetch('https://hooks.zapier.com/hooks/catch/...', { ... })
    }

    return new Response(
      JSON.stringify({ intent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
