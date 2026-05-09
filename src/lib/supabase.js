// ── Supabase Client ──────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('[Mailzy] ⚠️ Missing Supabase env vars!')
  console.error('  VITE_SUPABASE_URL:', SUPABASE_URL ? '✓ Set' : '✗ Missing')
  console.error('  VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON ? '✓ Set' : '✗ Missing')
  console.info('Add these to Vercel Environment Variables:')
  console.info('  https://vercel.com → Project Settings → Environment Variables')
}

export const supabase = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_ANON || 'placeholder', {
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
