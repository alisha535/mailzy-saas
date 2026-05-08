-- ═══════════════════════════════════════════════════════════
-- MAILZY ENTERPRISE DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── Enable Extensions ────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- for fast text search

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 001: PROFILES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  avatar_url  TEXT,
  plan        TEXT        NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE','PRO','ENTERPRISE')),
  coins       INTEGER     NOT NULL DEFAULT 1000,
  groq_key    TEXT,       -- encrypted client-side before storing
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 002: WORKSPACES (Multi-tenant)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.workspaces (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  owner_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan        TEXT        NOT NULL DEFAULT 'FREE',
  logo_url    TEXT,
  settings    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id            UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID  NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id       UUID  NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role          TEXT  NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER','ADMIN','MEMBER')),
  invited_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 003: SMTP ACCOUNTS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.smtp_accounts (
  id            UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID    NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL,
  from_name     TEXT    NOT NULL,
  host          TEXT,
  port          INTEGER DEFAULT 587,
  username      TEXT,
  password_enc  TEXT,   -- encrypted
  provider      TEXT    DEFAULT 'smtp',   -- smtp | resend | sendgrid | ses
  api_key_enc   TEXT,   -- encrypted
  daily_limit   INTEGER NOT NULL DEFAULT 50,
  hourly_limit  INTEGER NOT NULL DEFAULT 20,
  sent_today    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  warmup_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  warmup_day    INTEGER NOT NULL DEFAULT 1,
  health_score  INTEGER NOT NULL DEFAULT 100,  -- 0-100
  last_sent_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 004: LEADS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.leads (
  id            UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID    NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email         TEXT    NOT NULL,
  first_name    TEXT,
  last_name     TEXT,
  company       TEXT,
  job_title     TEXT,
  phone         TEXT,
  linkedin_url  TEXT,
  website       TEXT,
  location      TEXT,
  industry      TEXT,
  employees     TEXT,
  revenue       TEXT,
  status        TEXT    NOT NULL DEFAULT 'LEAD'
                  CHECK (status IN ('LEAD','INTERESTED','MEETING_BOOKED','MEETING_COMPLETED','WON','LOST','UNSUBSCRIBED')),
  score         INTEGER DEFAULT 0,
  custom_fields JSONB   NOT NULL DEFAULT '{}',
  notes         TEXT,
  unsubscribed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, email)
);

CREATE TABLE IF NOT EXISTS public.lead_tags (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id  UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag      TEXT NOT NULL,
  UNIQUE(lead_id, tag)
);

CREATE TABLE IF NOT EXISTS public.lead_activities (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id     UUID    NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type        TEXT    NOT NULL,  -- EMAIL_SENT | EMAIL_OPENED | EMAIL_REPLIED | STATUS_CHANGED | NOTE_ADDED
  description TEXT,
  metadata    JSONB   DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 005: CAMPAIGNS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.campaigns (
  id            UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID    NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'DRAFT'
                  CHECK (status IN ('DRAFT','ACTIVE','PAUSED','COMPLETED','ARCHIVED')),
  smtp_account_id UUID  REFERENCES public.smtp_accounts(id) ON DELETE SET NULL,
  from_name     TEXT    NOT NULL DEFAULT '',
  from_email    TEXT    NOT NULL DEFAULT '',
  daily_limit   INTEGER NOT NULL DEFAULT 50,
  track_opens   BOOLEAN NOT NULL DEFAULT TRUE,
  track_clicks  BOOLEAN NOT NULL DEFAULT TRUE,
  stop_on_reply BOOLEAN NOT NULL DEFAULT TRUE,
  randomize_delay BOOLEAN NOT NULL DEFAULT TRUE,
  timezone      TEXT    NOT NULL DEFAULT 'America/New_York',
  send_from     TIME    NOT NULL DEFAULT '09:00',
  send_to       TIME    NOT NULL DEFAULT '17:00',
  sending_days  TEXT[]  NOT NULL DEFAULT ARRAY['MON','TUE','WED','THU','FRI'],
  -- Stats (denormalized for fast reads)
  total_sent    INTEGER NOT NULL DEFAULT 0,
  total_opened  INTEGER NOT NULL DEFAULT 0,
  total_clicked INTEGER NOT NULL DEFAULT 0,
  total_replied INTEGER NOT NULL DEFAULT 0,
  total_leads   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.campaign_steps (
  id           UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id  UUID    NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  step_number  INTEGER NOT NULL,
  subject      TEXT    NOT NULL,
  body         TEXT    NOT NULL,
  delay_days   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, step_number)
);

CREATE TABLE IF NOT EXISTS public.campaign_leads (
  id           UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id  UUID    NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id      UUID    NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 1,
  status       TEXT    NOT NULL DEFAULT 'ACTIVE'
                 CHECK (status IN ('ACTIVE','PAUSED','COMPLETED','UNSUBSCRIBED','BOUNCED')),
  next_send_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, lead_id)
);

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 006: EMAIL QUEUE (The heart of the email sender)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.email_queue (
  id              UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    UUID    NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  smtp_account_id UUID    REFERENCES public.smtp_accounts(id) ON DELETE SET NULL,
  campaign_id     UUID    REFERENCES public.campaigns(id) ON DELETE SET NULL,
  campaign_step_id UUID   REFERENCES public.campaign_steps(id) ON DELETE SET NULL,
  lead_id         UUID    REFERENCES public.leads(id) ON DELETE SET NULL,
  -- Email content
  to_email        TEXT    NOT NULL,
  to_name         TEXT,
  from_email      TEXT    NOT NULL,
  from_name       TEXT    NOT NULL,
  reply_to        TEXT,
  subject         TEXT    NOT NULL,
  body_html       TEXT    NOT NULL,
  body_text       TEXT,
  -- State machine
  status          TEXT    NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','PROCESSING','SENT','DELIVERED','FAILED','PERMANENTLY_FAILED','BOUNCED')),
  retry_count     INTEGER NOT NULL DEFAULT 0,
  max_retries     INTEGER NOT NULL DEFAULT 3,
  error_message   TEXT,
  -- Tracking
  tracking_id     UUID    NOT NULL DEFAULT uuid_generate_v4(),
  opened          BOOLEAN NOT NULL DEFAULT FALSE,
  clicked         BOOLEAN NOT NULL DEFAULT FALSE,
  replied         BOOLEAN NOT NULL DEFAULT FALSE,
  bounced         BOOLEAN NOT NULL DEFAULT FALSE,
  -- Scheduling
  scheduled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 007: TRACKING EVENTS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.email_events (
  id             UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_id    UUID    NOT NULL REFERENCES public.email_queue(tracking_id) ON DELETE CASCADE,
  workspace_id   UUID    NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_type     TEXT    NOT NULL CHECK (event_type IN ('OPEN','CLICK','REPLY','BOUNCE','UNSUBSCRIBE')),
  ip_address     TEXT,
  user_agent     TEXT,
  clicked_url    TEXT,
  metadata       JSONB   DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 008: AI SYSTEM
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.ai_agents (
  id            UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID    NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  type          TEXT    NOT NULL CHECK (type IN ('SALES','REPLY','RESEARCH')),
  status        TEXT    NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED')),
  config        JSONB   NOT NULL DEFAULT '{}',
  leads_found   INTEGER NOT NULL DEFAULT 0,
  emails_sent   INTEGER NOT NULL DEFAULT 0,
  replies_handled INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.copilot_conversations (
  id            UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID    NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id       UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT,
  messages      JSONB   NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 009: ANALYTICS
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
  id            UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID    NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  date          DATE    NOT NULL,
  emails_sent   INTEGER NOT NULL DEFAULT 0,
  emails_opened INTEGER NOT NULL DEFAULT 0,
  emails_clicked INTEGER NOT NULL DEFAULT 0,
  emails_replied INTEGER NOT NULL DEFAULT 0,
  new_leads     INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, date)
);

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 010: EMAIL TEMPLATES
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.email_templates (
  id            UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id  UUID    NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  subject       TEXT    NOT NULL,
  body          TEXT    NOT NULL,
  category      TEXT    DEFAULT 'general',
  is_global     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 011: PERFORMANCE INDEXES
-- ══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_leads_workspace        ON public.leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_email            ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status           ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_search           ON public.leads USING gin(to_tsvector('english', coalesce(email,'') || ' ' || coalesce(first_name,'') || ' ' || coalesce(company,'')));
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace    ON public.campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status       ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_workspace  ON public.email_queue(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status     ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled  ON public.email_queue(scheduled_at) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_email_events_tracking  ON public.email_events(tracking_id);
CREATE INDEX IF NOT EXISTS idx_analytics_workspace    ON public.analytics_snapshots(workspace_id, date DESC);

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 012: AUTO-UPDATE TIMESTAMPS TRIGGER
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_profiles    BEFORE UPDATE ON public.profiles    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_workspaces  BEFORE UPDATE ON public.workspaces  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_campaigns   BEFORE UPDATE ON public.campaigns   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_leads       BEFORE UPDATE ON public.leads       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 013: ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smtp_accounts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_steps        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates       ENABLE ROW LEVEL SECURITY;

-- Helper: get workspace IDs for current user
CREATE OR REPLACE FUNCTION public.my_workspace_ids()
RETURNS SETOF UUID AS $$
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Profiles: own row only
CREATE POLICY "profiles_own"     ON public.profiles     FOR ALL USING (id = auth.uid());

-- Workspaces: member only
CREATE POLICY "workspaces_member" ON public.workspaces   FOR ALL USING (id IN (SELECT public.my_workspace_ids()));

-- Workspace members
CREATE POLICY "wm_member"        ON public.workspace_members FOR ALL USING (workspace_id IN (SELECT public.my_workspace_ids()));

-- All workspace-scoped tables follow same pattern
CREATE POLICY "smtp_member"      ON public.smtp_accounts        FOR ALL USING (workspace_id IN (SELECT public.my_workspace_ids()));
CREATE POLICY "leads_member"     ON public.leads                FOR ALL USING (workspace_id IN (SELECT public.my_workspace_ids()));
CREATE POLICY "lead_tags_member" ON public.lead_tags            FOR ALL USING (lead_id IN (SELECT id FROM public.leads WHERE workspace_id IN (SELECT public.my_workspace_ids())));
CREATE POLICY "lead_act_member"  ON public.lead_activities      FOR ALL USING (lead_id IN (SELECT id FROM public.leads WHERE workspace_id IN (SELECT public.my_workspace_ids())));
CREATE POLICY "campaigns_member" ON public.campaigns            FOR ALL USING (workspace_id IN (SELECT public.my_workspace_ids()));
CREATE POLICY "camp_steps"       ON public.campaign_steps       FOR ALL USING (campaign_id IN (SELECT id FROM public.campaigns WHERE workspace_id IN (SELECT public.my_workspace_ids())));
CREATE POLICY "camp_leads"       ON public.campaign_leads       FOR ALL USING (campaign_id IN (SELECT id FROM public.campaigns WHERE workspace_id IN (SELECT public.my_workspace_ids())));
CREATE POLICY "queue_member"     ON public.email_queue          FOR ALL USING (workspace_id IN (SELECT public.my_workspace_ids()));
CREATE POLICY "events_member"    ON public.email_events         FOR ALL USING (workspace_id IN (SELECT public.my_workspace_ids()));
CREATE POLICY "agents_member"    ON public.ai_agents            FOR ALL USING (workspace_id IN (SELECT public.my_workspace_ids()));
CREATE POLICY "copilot_member"   ON public.copilot_conversations FOR ALL USING (workspace_id IN (SELECT public.my_workspace_ids()));
CREATE POLICY "analytics_member" ON public.analytics_snapshots  FOR ALL USING (workspace_id IN (SELECT public.my_workspace_ids()));
CREATE POLICY "templates_member" ON public.email_templates      FOR ALL USING (workspace_id IN (SELECT public.my_workspace_ids()) OR is_global = TRUE);

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 014: AI WORKFLOW FEATURES
-- ══════════════════════════════════════════════════════════════
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tech_stack TEXT[];
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS recent_news TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS personalization_opener TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';

CREATE TABLE IF NOT EXISTS public.ai_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  constraints JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_prompts_member" ON public.ai_prompts FOR ALL USING (workspace_id IN (SELECT public.my_workspace_ids()));

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_ai_prompts BEFORE UPDATE ON public.ai_prompts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS ai_intent_tag TEXT;

-- ══════════════════════════════════════════════════════════════
-- MIGRATION 015: ATOMIC QUEUE PROCESSING RPC
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.process_email_queue_batch(batch_size INT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH next_emails AS (
    SELECT id
    FROM public.email_queue
    WHERE status = 'PENDING'
      AND scheduled_at <= NOW()
    ORDER BY scheduled_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  ),
  updated_emails AS (
    UPDATE public.email_queue
    SET status = 'PROCESSING',
        processed_at = NOW()
    WHERE id IN (SELECT id FROM next_emails)
    RETURNING *
  )
  SELECT json_agg(
    json_build_object(
      'id', u.id,
      'to_email', u.to_email,
      'to_name', u.to_name,
      'from_email', u.from_email,
      'from_name', u.from_name,
      'reply_to', u.reply_to,
      'subject', u.subject,
      'body_html', u.body_html,
      'body_text', u.body_text,
      'retry_count', u.retry_count,
      'smtp_account', json_build_object(
        'host', s.host,
        'port', s.port,
        'username', s.username,
        'password_enc', s.password_enc,
        'email', s.email
      )
    )
  ) INTO result
  FROM updated_emails u
  LEFT JOIN public.smtp_accounts s ON u.smtp_account_id = s.id;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;
