import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = 'info', duration = 3500) => {
    const id = crypto.randomUUID()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration)
  }, [])

  const success = useCallback((msg) => toast(msg, 'success'), [toast])
  const error   = useCallback((msg) => toast(msg, 'error', 5000), [toast])
  const info    = useCallback((msg) => toast(msg, 'info'), [toast])
  const warn    = useCallback((msg) => toast(msg, 'warn'), [toast])
  const dismiss = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), [])

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warn, dismiss }}>
      {children}
      <ToastBar toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastBar({ toasts, dismiss }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-24 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl text-xs font-semibold backdrop-blur-md cursor-pointer animate-fade-in
            ${t.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/30 text-emerald-300'
            : t.type === 'error'   ? 'bg-red-950/95 border-red-500/30 text-red-300'
            : t.type === 'warn'    ? 'bg-amber-950/95 border-amber-500/30 text-amber-300'
            : 'bg-slate-900/95 border-slate-700/50 text-slate-300'}`}
        >
          <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warn' ? '⚠' : 'ℹ'}</span>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
