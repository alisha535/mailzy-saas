// ── Security Utilities — Input Validation & Sanitization ─────────────────────

/**
 * Strip HTML tags, script injection, and dangerous patterns.
 * Use on ALL user inputs before storing to database or passing to AI.
 */
export function sanitize(str, maxLen = 5000) {
  return String(str ?? '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '') // remove script tags
    .replace(/<[^>]*>/g, '')                              // strip all HTML
    .replace(/javascript:/gi, '')                         // remove js: protocol
    .replace(/on\w+\s*=/gi, '')                          // remove event handlers
    .replace(/data:/gi, '')                               // remove data: URIs
    .trim()
    .slice(0, maxLen)
}

/**
 * Validate email format strictly.
 */
export function isValidEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]{1,253}\.[a-zA-Z]{2,}$/
  return re.test(String(email ?? '').toLowerCase().trim())
}

/**
 * Validate that a string only contains safe characters for names.
 */
export function isValidName(name, maxLen = 100) {
  const str = String(name ?? '').trim()
  return str.length > 0 && str.length <= maxLen && /^[\w\s\-'.]+$/u.test(str)
}

/**
 * Validate SMTP host format.
 */
export function isValidHost(host) {
  const str = String(host ?? '').trim()
  return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(str)
}

/**
 * Validate port number.
 */
export function isValidPort(port) {
  const n = Number(port)
  return Number.isInteger(n) && n >= 1 && n <= 65535
}

/**
 * Validate a UUID format (Supabase IDs).
 */
export function isValidUUID(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id ?? ''))
}

/**
 * Validate Groq API key format.
 */
export function isValidGroqKey(key) {
  return /^gsk_[A-Za-z0-9]{50,}$/.test(String(key ?? ''))
}

/**
 * Frontend rate limiter — prevents button-spam DDoS on API calls.
 * Usage: const { allowed, remaining } = rateLimit('write-email', 5, 30)
 */
const rlStore = new Map()
export function rateLimit(key, maxCalls = 10, windowSecs = 60) {
  const now = Date.now()
  const entry = rlStore.get(key) || { count: 0, reset: now + windowSecs * 1000 }

  if (now > entry.reset) {
    entry.count = 0
    entry.reset = now + windowSecs * 1000
  }

  if (entry.count >= maxCalls) {
    const secs = Math.ceil((entry.reset - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter: secs }
  }

  entry.count++
  rlStore.set(key, entry)
  return { allowed: true, remaining: maxCalls - entry.count, retryAfter: 0 }
}

/**
 * Sanitize a CSV row before bulk lead import.
 * Prevents injection of malformed data into the database.
 */
export function sanitizeLeadRow(row) {
  const email = String(row.email ?? '').toLowerCase().trim()
  if (!isValidEmail(email)) return null   // Drop invalid rows silently

  return {
    email,
    first_name: sanitize(row.first_name || row.firstName || row.name?.split(' ')[0] || '', 100),
    last_name:  sanitize(row.last_name  || row.lastName  || row.name?.split(' ').slice(1).join(' ') || '', 100),
    company:    sanitize(row.company || '', 200),
    job_title:  sanitize(row.job_title || row.title || '', 150),
    location:   sanitize(row.location || '', 200),
    phone:      sanitize(row.phone || '', 30),
    linkedin:   sanitize(row.linkedin || '', 300),
  }
}

/**
 * Validate campaign form fields before creating.
 * Returns { valid: boolean, errors: Record<string, string> }
 */
export function validateCampaignForm(form) {
  const errors = {}
  if (!sanitize(form.name, 200)) errors.name = 'Campaign name is required'
  if (!isValidEmail(form.from_email)) errors.from_email = 'Valid from email is required'
  if (!sanitize(form.from_name, 100)) errors.from_name = 'From name is required'
  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * Validate SMTP account fields.
 */
export function validateSmtpForm(form) {
  const errors = {}
  if (!isValidEmail(form.email)) errors.email = 'Valid email required'
  if (!form.username?.trim())    errors.username = 'Username required'
  if (!form.password_enc?.trim()) errors.password_enc = 'Password required'
  if (!isValidHost(form.host))   errors.host = 'Valid SMTP host required'
  if (!isValidPort(form.port))   errors.port = 'Port must be 1–65535'
  return { valid: Object.keys(errors).length === 0, errors }
}
