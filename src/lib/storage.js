// ── Local Storage Utility (lightweight key-value store) ───────
// Used only for non-sensitive UI preferences (NOT for business data)
// All real data lives in Supabase

export const db = {
  get:   (k, d = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d } },
  set:   (k, v)        => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
  del:   (k)           => { try { localStorage.removeItem(k) } catch {} },
  patch: (k, p, d = {}) => { const c = db.get(k, d); const n = { ...c, ...p }; db.set(k, n); return n },
}
