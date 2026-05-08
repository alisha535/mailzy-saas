// ── App Constants ─────────────────────────────────────────────
export const APP = {
  name:        'Mailzy',
  version:     '3.0.0',
  plan:        { free: 'FREE', pro: 'PRO', enterprise: 'ENTERPRISE' },
}

// ── AI Config ─────────────────────────────────────────────────
export const AI = {
  groqUrl:   'https://api.groq.com/openai/v1/chat/completions',
  groqModel: 'llama3-8b-8192',
  maxTokens: 700,
}

// ── Email Queue States ────────────────────────────────────────
export const EMAIL_STATUS = {
  PENDING:             'PENDING',
  PROCESSING:          'PROCESSING',
  SENT:                'SENT',
  DELIVERED:           'DELIVERED',
  FAILED:              'FAILED',
  PERMANENTLY_FAILED:  'PERMANENTLY_FAILED',
  BOUNCED:             'BOUNCED',
}

// ── Campaign States ───────────────────────────────────────────
export const CAMPAIGN_STATUS = {
  DRAFT:    'DRAFT',
  ACTIVE:   'ACTIVE',
  PAUSED:   'PAUSED',
  COMPLETED:'COMPLETED',
  ARCHIVED: 'ARCHIVED',
}

// ── Lead States ───────────────────────────────────────────────
export const LEAD_STATUS = {
  LEAD:               'LEAD',
  INTERESTED:         'INTERESTED',
  MEETING_BOOKED:     'MEETING_BOOKED',
  MEETING_COMPLETED:  'MEETING_COMPLETED',
  WON:                'WON',
  LOST:               'LOST',
  UNSUBSCRIBED:       'UNSUBSCRIBED',
}

// ── Retry Config ──────────────────────────────────────────────
export const RETRY = {
  maxAttempts:  3,
  baseDelayMs:  1000,
  maxDelayMs:   8000,
}

// ── Pagination ────────────────────────────────────────────────
export const PAGE_SIZE = 25

// ── Sending Limits ────────────────────────────────────────────
export const SEND_LIMITS = {
  free:       { daily: 100,  hourly: 20  },
  pro:        { daily: 1000, hourly: 100 },
  enterprise: { daily: 9999, hourly: 500 },
}
