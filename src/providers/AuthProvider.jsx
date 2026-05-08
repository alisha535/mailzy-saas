import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Load session on mount ────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Load profile from DB ─────────────────────────────────────
  async function loadProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*, workspaces(*)')
        .eq('id', userId)
        .single()
      setProfile(data)
    } catch (e) {
      console.error('[Auth] Profile load failed:', e)
    } finally {
      setLoading(false)
    }
  }

  // ── Sign up ──────────────────────────────────────────────────
  async function signUp({ name, email, password }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw error

    // Create profile + default workspace
    if (data.user) {
      await supabase.from('profiles').insert({
        id:   data.user.id,
        name,
        email,
        plan: 'FREE',
        coins: 1000,
      })
      const { data: ws } = await supabase.from('workspaces').insert({
        name:       `${name}'s Workspace`,
        owner_id:   data.user.id,
      }).select().single()

      if (ws) {
        await supabase.from('workspace_members').insert({
          workspace_id: ws.id,
          user_id:      data.user.id,
          role:         'OWNER',
        })
      }
    }
    return data
  }

  // ── Sign in ──────────────────────────────────────────────────
  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  // ── Sign out ─────────────────────────────────────────────────
  async function signOut() {
    await supabase.auth.signOut()
  }

  // ── Update profile ───────────────────────────────────────────
  async function updateProfile(patch) {
    if (!user) return
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    setProfile(prev => ({ ...prev, ...data }))
    return data
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
