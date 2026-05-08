// ── Secure AI Client — All calls go through Supabase Edge Function ───────────
// The Groq API key NEVER touches the browser. Zero exposure risk.
import { supabase } from './supabase'

/**
 * Call the AI via the secure groq-proxy Edge Function.
 * Handles auth token injection, error normalization, and response parsing.
 */
export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('groq-proxy', {
    body: {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens:  options.maxTokens  ?? 600,
      temperature: options.temperature ?? 0.7,
    },
  })

  if (error) throw new Error(error.message || 'AI service unavailable')
  if (data?.error) throw new Error(data.error)
  return data?.content ?? ''
}

/**
 * Call AI with a full message history (for chat/copilot features).
 */
export async function callAIChat(
  systemPrompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxTokens = 600
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('groq-proxy', {
    body: {
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10), // last 10 messages for context
      ],
      max_tokens: maxTokens,
    },
  })

  if (error) throw new Error(error.message || 'AI service unavailable')
  if (data?.error) throw new Error(data.error)
  return data?.content ?? ''
}
