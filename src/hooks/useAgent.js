// ── Secure AI Agent Hook — Routes through Supabase Edge Function ──────────────
// Groq API key is NEVER sent to/from the browser. Zero exposure.
import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { callAI } from '../lib/aiClient'
import { useWorkspace } from '../providers/WorkspaceProvider'
import { safeQuery } from '../lib/utils'

export function useAgent() {
  const { workspace } = useWorkspace()
  const [agents,   setAgents]   = useState([])
  const [agentLog, setAgentLog] = useState([])
  const [loading,  setLoading]  = useState(false)

  const log = useCallback((type, msg) =>
    setAgentLog(l => [...l, { type, msg, time: new Date().toLocaleTimeString() }]),
  [])

  // ── Load agents from Supabase ─────────────────────────────
  const loadAgents = useCallback(async () => {
    if (!workspace) return
    const { data } = await safeQuery(() =>
      supabase.from('ai_agents').select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
    )
    setAgents(data ?? [])
  }, [workspace])

  // ── Write a real personalized cold email ──────────────────
  const writeEmail = useCallback(async (lead, context = '') => {
    setLoading(true)
    log('write', `Writing email for ${lead.first_name || lead.email}...`)
    try {
      const email = await callAI(
        'You are an expert cold email copywriter. Write a short, personalized, human-sounding cold email under 80 words. No subject line. Be specific to the person. End with ONE clear CTA question. No fluff, no spam words.',
        `Write a cold email to:
Name: ${sanitize(lead.first_name || '')} ${sanitize(lead.last_name || '')}
Title: ${sanitize(lead.job_title || 'Professional')}
Company: ${sanitize(lead.company || 'their company')}
Context: ${sanitize(context || 'B2B outreach')}
Keep it under 80 words. Be genuine and specific.`
      )
      log('write', `✅ Email written for ${lead.first_name || lead.email}`)
      return email
    } catch (err) {
      log('error', `❌ ${err.message}`)
      return fallbackEmail(lead)
    } finally {
      setLoading(false)
    }
  }, [log])

  // ── Analyze reply sentiment with AI ───────────────────────
  const analyzeReply = useCallback(async (text) => {
    log('analyze', 'Analyzing reply...')
    try {
      const result = await callAI(
        'You are a sales reply intent classifier. Respond ONLY with a JSON object, no other text. Format: {"sentiment":"POSITIVE"|"NEGATIVE"|"NEUTRAL","action":"BOOK_MEETING"|"FOLLOW_UP"|"UNSUBSCRIBE","confidence":0-100,"summary":"1 sentence"}',
        `Classify this reply:\n\n"${sanitize(text).slice(0, 2000)}"`,
        { maxTokens: 200, temperature: 0.2 }
      )
      try {
        const parsed = JSON.parse(result)
        log('analyze', `✅ Intent: ${parsed.sentiment} → ${parsed.action}`)
        return parsed
      } catch {
        return keywordAnalyze(text)
      }
    } catch {
      return keywordAnalyze(text)
    }
  }, [log])

  // ── Write an auto-reply ────────────────────────────────────
  const autoReply = useCallback(async (lead, sentiment) => {
    log('reply', `Writing reply for ${sentiment} sentiment...`)
    try {
      const reply = await callAI(
        'You are a professional sales rep. Write a short, human reply email under 60 words. No subject line needed.',
        `Write a reply to ${sanitize(lead.first_name || 'there')} who sent a ${sentiment} response. 
If POSITIVE: thank them, confirm next steps, suggest time slots.
If NEUTRAL: provide more value, answer their implied question.
If NEGATIVE: be gracious, end the conversation politely.`,
        { maxTokens: 200 }
      )
      log('reply', `✅ Reply drafted`)
      return reply
    } catch {
      return fallbackReply(lead.first_name || 'there', sentiment)
    }
  }, [log])

  // ── Generate email subject lines ──────────────────────────
  const generateSubjectLines = useCallback(async (context, count = 5) => {
    log('generate', `Generating ${count} subject lines...`)
    try {
      const result = await callAI(
        `Generate exactly ${count} cold email subject lines. Return ONLY a JSON array of strings, nothing else.`,
        `Context: ${sanitize(context).slice(0, 500)}\n\nRequirements: under 50 chars each, no spam words, high open rate.`,
        { maxTokens: 300, temperature: 0.8 }
      )
      const lines = JSON.parse(result)
      log('generate', `✅ Generated ${lines.length} subject lines`)
      return Array.isArray(lines) ? lines : []
    } catch (err) {
      log('error', `❌ ${err.message}`)
      return []
    }
  }, [log])

  // ── Create agent in Supabase ──────────────────────────────
  const createAgent = useCallback(async (config) => {
    if (!workspace) return null
    const name = sanitize(config.name).slice(0, 100)
    const { data, error } = await safeQuery(() =>
      supabase.from('ai_agents').insert({
        workspace_id: workspace.id,
        name,
        type: config.type || 'SALES',
        status: 'ACTIVE',
        config: {},
      }).select().single()
    )
    if (!error && data) {
      setAgents(prev => [data, ...prev])
      log('create', `✅ Agent "${name}" created`)
    }
    return data
  }, [workspace, log])

  const toggleAgent = useCallback(async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    const { data } = await safeQuery(() =>
      supabase.from('ai_agents').update({ status: newStatus }).eq('id', id).select().single()
    )
    if (data) setAgents(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
  }, [])

  const removeAgent = useCallback(async (id) => {
    await safeQuery(() => supabase.from('ai_agents').delete().eq('id', id))
    setAgents(prev => prev.filter(a => a.id !== id))
  }, [])

  return { agents, agentLog, loading, loadAgents, createAgent, toggleAgent, removeAgent, writeEmail, analyzeReply, autoReply, generateSubjectLines }
}

// ── Input sanitizer (strip HTML/script tags) ──────────────────
function sanitize(str) {
  return String(str ?? '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .trim()
}

// ── Fallback templates (edge function unavailable) ────────────
function fallbackEmail(lead) {
  const name = sanitize(lead.first_name || 'there')
  const company = sanitize(lead.company || 'your company')
  return `Hi ${name},\n\nNoticed ${company} has been scaling rapidly — congrats on that.\n\nWe help companies like yours 3x cold email reply rates without extra headcount.\n\nWould a 15-min call this week make sense?\n\n[Your name]`
}

function fallbackReply(firstName, sentiment) {
  const name = sanitize(firstName)
  const templates = {
    POSITIVE: `Hi ${name},\n\nGreat to hear! Happy to jump on a quick call.\n\nAre you free Thursday or Friday this week?\n\nLooking forward to it!`,
    NEUTRAL:  `Hi ${name},\n\nThanks for getting back! Happy to share more details.\n\nWould a quick 10-minute call work for you?`,
    NEGATIVE: `Hi ${name},\n\nAbsolutely understand — removing you from our list now.\n\nFeel free to reach back out anytime if things change.\n\nBest wishes!`,
  }
  return templates[sentiment] || templates.NEUTRAL
}

function keywordAnalyze(text) {
  const lower = text.toLowerCase()
  const positive = ['interested', 'yes', "let's chat", 'sounds good', 'tell me more', 'great', 'love', 'perfect', 'let me know', 'send me']
  const negative = ['not interested', 'remove', 'unsubscribe', 'stop', 'no thanks', 'wrong person', 'do not contact']
  if (positive.some(w => lower.includes(w))) return { sentiment: 'POSITIVE', action: 'BOOK_MEETING', confidence: 88, summary: 'Prospect expressed interest' }
  if (negative.some(w => lower.includes(w))) return { sentiment: 'NEGATIVE', action: 'UNSUBSCRIBE', confidence: 92, summary: 'Prospect not interested' }
  return { sentiment: 'NEUTRAL', action: 'FOLLOW_UP', confidence: 70, summary: 'Unclear intent, follow up' }
}
