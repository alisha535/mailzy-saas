// ── Supabase Client ──────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('[Mailzy] Missing Supabase env vars. Check your .env file.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: true,
  },
  global: {
    headers: { 'x-app-name': 'mailzy-v3' },
  },
})

// ── Health check ──────────────────────────────────────────────
export async function checkConnection() {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}
