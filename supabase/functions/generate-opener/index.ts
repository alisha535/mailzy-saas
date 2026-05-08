import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { lead_id, prompt_id } = await req.json()

    // 1. Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 2. Fetch Lead Data
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .select('*, tech_stack, recent_news')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) throw new Error('Lead not found')

    // 3. Fetch Prompt Data
    const { data: aiPrompt, error: promptError } = await supabaseClient
      .from('ai_prompts')
      .select('*')
      .eq('id', prompt_id)
      .single()

    if (promptError || !aiPrompt) throw new Error('Prompt not found')

    // 4. Validate Constraints
    const requiredVars = aiPrompt.constraints?.required_variables || []
    for (const v of requiredVars) {
      if (!lead[v] || lead[v].length === 0) {
        return new Response(JSON.stringify({ 
          error: `Missing required variable: ${v}`,
          status: 'FALLBACK_REQUIRED'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }
    }

    // 5. Call LLM (OpenAI / Anthropic)
    // Replace with actual API call. 
    // Example uses a mock response for now to prevent failures without real API keys
    const mockOpener = `Saw your recent news about ${lead.recent_news || 'your company'}. Impressive that you're scaling with ${lead.tech_stack?.[0] || 'your current stack'}.`

    // 6. Update Lead with new opener
    const { error: updateError } = await supabaseClient
      .from('leads')
      .update({ personalization_opener: mockOpener })
      .eq('id', lead_id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ opener: mockOpener }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
