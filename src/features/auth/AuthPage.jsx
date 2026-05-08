import { useState } from 'react'
import { useAuth }  from '../../providers/AuthProvider'
import { useToast } from '../../providers/ToastProvider'

export default function AuthPage() {
  const { signIn, signUp }       = useAuth()
  const { success, error: showErr } = useToast()
  const [mode, setMode]          = useState('signin')
  const [loading, setLoading]    = useState(false)
  const [showPw, setShowPw]      = useState(false)
  const [err, setErr]            = useState('')
  const [form, setForm]          = useState({ name: '', email: '', password: '' })
  const f = k => v => setForm(p => ({ ...p, [k]: v }))

  async function submit() {
    setErr('')
    if (!form.email || !form.password) return setErr('Please fill all fields.')
    if (mode === 'signup' && !form.name) return setErr('Name is required.')
    if (form.password.length < 6) return setErr('Password must be at least 6 characters.')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp({ name: form.name, email: form.email, password: form.password })
        success('Account created! Check your email to confirm.')
      } else {
        await signIn({ email: form.email, password: form.password })
      }
    } catch (e) {
      setErr(e.message || 'Authentication failed. Please try again.')
      showErr(e.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:'radial-gradient(circle at 1px 1px,rgba(255,255,255,0.025) 1px,transparent 0)', backgroundSize:'44px 44px' }} />
      <div className="absolute top-[-20%] left-[5%] w-[600px] h-[600px] rounded-full bg-blue-600/7 blur-[140px]" />
      <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full bg-violet-600/7 blur-[120px]" />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-xl shadow-blue-500/40 text-white text-xl">⚡</div>
          <span className="text-white font-black text-xl tracking-tight">Mailzy</span>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <h1 className="text-2xl font-black text-white mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Get started free'}
          </h1>
          <p className="text-slate-500 text-sm mb-7">
            {mode === 'signin' ? 'Sign in to your workspace' : 'Create your account in seconds'}
          </p>

          <div className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5">Full Name</label>
                <input
                  value={form.name} onChange={e => f('name')(e.target.value)}
                  placeholder="John Smith"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1.5">Email</label>
              <input
                type="email" value={form.email} onChange={e => f('email')(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="you@company.com"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password} onChange={e => f('password')(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 pr-11 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                />
                <button onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {err && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-red-400 text-xs">
                {err}
              </div>
            )}

            <button
              onClick={submit} disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 disabled:opacity-60 text-white font-black py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{mode === 'signin' ? 'Signing in...' : 'Creating...'}</>
                : mode === 'signin' ? 'Sign In' : 'Create Free Account'
              }
            </button>
          </div>

          <p className="text-center text-slate-500 text-sm mt-5">
            {mode === 'signin' ? 'No account? ' : 'Have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErr('') }}
              className="text-blue-400 hover:text-blue-300 font-bold transition-colors"
            >
              {mode === 'signin' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-slate-700 text-xs mt-5">
          Enterprise-grade cold email platform · Powered by Supabase + Groq AI
        </p>
      </div>
    </div>
  )
}
