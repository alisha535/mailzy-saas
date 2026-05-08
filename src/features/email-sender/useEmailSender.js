import { useCallback, useState } from 'react'
import { supabase }         from '../../lib/supabase'
import { useWorkspace }     from '../../providers/WorkspaceProvider'
import { useToast }         from '../../providers/ToastProvider'
import { safeQuery, withRetry, interpolate, chunk } from '../../lib/utils'
import { EMAIL_STATUS }     from '../../lib/constants'

export function useEmailSender() {
  const { workspace }              = useWorkspace()
  const { success, error: showErr } = useToast()
  const [queue, setQueue]          = useState([])
  const [loading, setLoading]      = useState(false)
  const [sending, setSending]      = useState(false)

  // ── Load email queue ─────────────────────────────────────────
  const loadQueue = useCallback(async (filters = {}) => {
    if (!workspace) return
    setLoading(true)
    const { data, error } = await safeQuery(() =>
      supabase
        .from('email_queue')
        .select(`
          *,
          leads(first_name, last_name, email, company),
          campaigns(name),
          smtp_accounts(name, email)
        `)
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(100)
    )
    if (error) showErr('Failed to load email queue')
    else setQueue(data ?? [])
    setLoading(false)
  }, [workspace])

  // ── Queue a single email ─────────────────────────────────────
  const queueEmail = useCallback(async ({
    toEmail, toName, fromEmail, fromName, replyTo,
    subject, bodyHtml, bodyText,
    smtpAccountId, campaignId, campaignStepId, leadId,
    scheduledAt = new Date().toISOString(),
  }) => {
    if (!workspace) return null
    const { data, error } = await safeQuery(() =>
      supabase.from('email_queue').insert({
        workspace_id:      workspace.id,
        smtp_account_id:   smtpAccountId,
        campaign_id:       campaignId,
        campaign_step_id:  campaignStepId,
        lead_id:           leadId,
        to_email:          toEmail,
        to_name:           toName,
        from_email:        fromEmail,
        from_name:         fromName,
        reply_to:          replyTo,
        subject,
        body_html:         bodyHtml,
        body_text:         bodyText ?? bodyHtml.replace(/<[^>]+>/g, ''),
        status:            EMAIL_STATUS.PENDING,
        scheduled_at:      scheduledAt,
      }).select().single()
    )
    if (error) { showErr('Failed to queue email'); return null }
    setQueue(prev => [data, ...prev])
    return data
  }, [workspace])

  // ── Bulk queue from campaign step ────────────────────────────
  const bulkQueueCampaignStep = useCallback(async ({
    campaign, step, leads, smtpAccountId
  }) => {
    if (!workspace || !leads.length) return 0
    setSending(true)
    let queued = 0
    // Process in chunks of 50 to avoid request timeouts
    const batches = chunk(leads, 50)
    for (const batch of batches) {
      const rows = batch.map(lead => ({
        workspace_id:     workspace.id,
        smtp_account_id:  smtpAccountId,
        campaign_id:      campaign.id,
        campaign_step_id: step.id,
        lead_id:          lead.id,
        to_email:         lead.email,
        to_name:          `${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim(),
        from_email:       campaign.from_email,
        from_name:        campaign.from_name,
        subject:          interpolate(step.subject, {
          firstName: lead.first_name,
          lastName:  lead.last_name,
          company:   lead.company,
          jobTitle:  lead.job_title,
        }),
        body_html:        interpolate(step.body, {
          firstName: lead.first_name,
          lastName:  lead.last_name,
          company:   lead.company,
          jobTitle:  lead.job_title,
        }),
        status:           EMAIL_STATUS.PENDING,
        scheduled_at:     new Date().toISOString(),
      }))

      const { error } = await safeQuery(() =>
        supabase.from('email_queue').insert(rows)
      )
      if (!error) queued += batch.length
    }
    setSending(false)
    if (queued > 0) success(`${queued} emails queued for sending`)
    else showErr('Failed to queue emails')
    await loadQueue()
    return queued
  }, [workspace, loadQueue])

  // ── Retry failed email ───────────────────────────────────────
  const retryEmail = useCallback(async (emailId) => {
    const { error } = await safeQuery(() =>
      supabase.from('email_queue')
        .update({ status: EMAIL_STATUS.PENDING, error_message: null, retry_count: 0 })
        .eq('id', emailId)
    )
    if (!error) {
      setQueue(prev => prev.map(e => e.id === emailId
        ? { ...e, status: EMAIL_STATUS.PENDING, error_message: null }
        : e
      ))
      success('Email re-queued for sending')
    }
  }, [])

  // ── Cancel pending email ─────────────────────────────────────
  const cancelEmail = useCallback(async (emailId) => {
    const { error } = await safeQuery(() =>
      supabase.from('email_queue').delete().eq('id', emailId)
    )
    if (!error) {
      setQueue(prev => prev.filter(e => e.id !== emailId))
      success('Email cancelled')
    }
  }, [])

  // ── Get queue stats ──────────────────────────────────────────
  const getStats = useCallback(() => {
    const total    = queue.length
    const pending  = queue.filter(e => e.status === EMAIL_STATUS.PENDING).length
    const sent     = queue.filter(e => e.status === EMAIL_STATUS.SENT).length
    const failed   = queue.filter(e => e.status === EMAIL_STATUS.FAILED || e.status === EMAIL_STATUS.PERMANENTLY_FAILED).length
    const opened   = queue.filter(e => e.opened).length
    const replied  = queue.filter(e => e.replied).length
    return { total, pending, sent, failed, opened, replied,
      openRate:  sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0',
      replyRate: sent > 0 ? ((replied / sent) * 100).toFixed(1) : '0',
    }
  }, [queue])

  return { queue, loading, sending, loadQueue, queueEmail, bulkQueueCampaignStep, retryEmail, cancelEmail, getStats }
}
