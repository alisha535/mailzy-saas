import { RETRY } from './constants'

// ── Retry with exponential backoff ────────────────────────────
export async function withRetry(fn, options = {}) {
  const { maxAttempts = RETRY.maxAttempts, baseDelayMs = RETRY.baseDelayMs } = options
  let lastError
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt === maxAttempts) break
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), RETRY.maxDelayMs)
      await sleep(delay)
    }
  }
  throw lastError
}

// ── Sleep ─────────────────────────────────────────────────────
export const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ── Safe Supabase call with error normalization ───────────────
export async function safeQuery(queryFn) {
  try {
    const { data, error } = await queryFn()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[Mailzy] Query error:', error)
    return { data: null, error: error?.message || 'An unexpected error occurred' }
  }
}

// ── Template variable replacer ────────────────────────────────
export function interpolate(template, vars = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

// ── Generate unique ID ────────────────────────────────────────
export const uid = () => crypto.randomUUID()

// ── Format relative time ──────────────────────────────────────
export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1)  return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24)  return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

// ── Format number ────────────────────────────────────────────
export function fmtNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K'
  return String(n ?? 0)
}

// ── Truncate string ───────────────────────────────────────────
export const truncate = (str, len = 50) =>
  str?.length > len ? str.slice(0, len) + '…' : (str ?? '')

// ── Validate email format ─────────────────────────────────────
export const isValidEmail = (email) =>
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email ?? '')

// ── Debounce ──────────────────────────────────────────────────
export function debounce(fn, ms = 300) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}

// ── Group array by key ────────────────────────────────────────
export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = typeof key === 'function' ? key(item) : item[key]
    ;(acc[k] = acc[k] || []).push(item)
    return acc
  }, {})
}

// ── Chunk array ───────────────────────────────────────────────
export const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size))
