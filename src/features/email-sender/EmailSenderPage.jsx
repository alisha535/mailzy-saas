import { useState, useEffect } from 'react'
import { useEmailSender }   from './useEmailSender'
import { useWorkspace }     from '../../providers/WorkspaceProvider'
import { supabase }         from '../../lib/supabase'
import { EMAIL_STATUS }     from '../../lib/constants'
import { timeAgo, fmtNum } from '../../lib/utils'

const STATUS_COLOR = {
  PENDING:            'text-amber-400 bg-amber-500/10 border-amber-500/20',
  PROCESSING:         'text-blue-400 bg-blue-500/10 border-blue-500/20',
  SENT:               'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  DELIVERED:          'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  FAILED:             'text-red-400 bg-red-500/10 border-red-500/20',
  PERMANENTLY_FAILED: 'text-red-400 bg-red-500/10 border-red-500/20',
  BOUNCED:            'text-orange-400 bg-orange-500/10 border-orange-500/20',
}

export default function EmailSenderPage() {
  const { workspace }                        = useWorkspace()
  const { queue, loading, loadQueue, queueEmail, retryEmail, cancelEmail, getStats } = useEmailSender()
  const [tab, setTab]                        = useState('compose')
  const [smtpAccounts, setSmtpAccounts]      = useState([])
  const [templates, setTemplates]            = useState([])
  const [sending, setSending]                = useState(false)
  const [sent, setSent]                      = useState(false)

  // Compose form state
  const [form, setForm] = useState({
    toEmail: '', toName: '', fromEmail: '', fromName: '',
    replyTo: '', subject: '', body: '',
    smtpAccountId: '', scheduledAt: '',
  })
  const f = k => v => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (workspace) {
      loadQueue()
      loadSmtpAccounts()
      loadTemplates()
    }
  }, [workspace])

  async function loadSmtpAccounts() {
    if (!workspace) return
    const { data } = await supabase
      .from('smtp_accounts')
      .select('id, name, email, from_name, daily_limit, sent_today, is_active')
      .eq('workspace_id', workspace.id)
      .eq('is_active', true)
    setSmtpAccounts(data ?? [])
    if (data?.[0]) {
      setForm(p => ({ ...p, smtpAccountId: data[0].id, fromEmail: data[0].email, fromName: data[0].from_name }))
    }
  }

  async function loadTemplates() {
    if (!workspace) return
    const { data } = await supabase
      .from('email_templates')
      .select('id, name, subject, body')
      .or(`workspace_id.eq.${workspace.id},is_global.eq.true`)
      .order('name')
    setTemplates(data ?? [])
  }

  async function handleSend() {
    if (!form.toEmail || !form.subject || !form.body) return
    setSending(true)
    const result = await queueEmail({
      toEmail:       form.toEmail,
      toName:        form.toName,
      fromEmail:     form.fromEmail,
      fromName:      form.fromName,
      replyTo:       form.replyTo,
      subject:       form.subject,
      bodyHtml:      form.body.replace(/\n/g, '<br>'),
      bodyText:      form.body,
      smtpAccountId: form.smtpAccountId || null,
      scheduledAt:   form.scheduledAt || new Date().toISOString(),
    })
    setSending(false)
    if (result) {
      setSent(true)
      setForm(p => ({ ...p, toEmail: '', toName: '', subject: '', body: '', replyTo: '' }))
      setTimeout(() => setSent(false), 3000)
      setTab('queue')
    }
  }

  const stats = getStats()

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-white font-black text-lg">Email Sender</h2>
          <p className="text-slate-500 text-xs mt-0.5">Compose, queue, and track outbound emails</p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: 'Pending',  value: fmtNum(stats.pending), color: 'text-amber-400' },
            { label: 'Sent',     value: fmtNum(stats.sent),    color: 'text-emerald-400' },
            { label: 'Open Rate', value: stats.openRate + '%', color: 'text-blue-400' },
            { label: 'Reply Rate',value: stats.replyRate + '%',color: 'text-violet-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-1.5 text-center">
              <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
              <p className="text-slate-600 text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-3 shrink-0">
        {[
          { id: 'compose', label: '✏️ Compose' },
          { id: 'queue',   label: `📥 Queue (${stats.total})` },
          { id: 'sent',    label: `✅ Sent (${stats.sent})` },
          { id: 'failed',  label: `❌ Failed (${stats.failed})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === t.id
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">

        {/* ── COMPOSE TAB ───────────────────────────────── */}
        {tab === 'compose' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {sent && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm font-semibold flex items-center gap-2">
                ✓ Email queued for sending!
              </div>
            )}

            {/* SMTP Account Selector */}
            {smtpAccounts.length > 0 && (
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
                <label className="block text-slate-400 text-xs font-semibold mb-2">Send From (SMTP Account)</label>
                <div className="grid grid-cols-2 gap-2">
                  {smtpAccounts.map(acc => (
                    <button key={acc.id}
                      onClick={() => setForm(p => ({ ...p, smtpAccountId: acc.id, fromEmail: acc.email, fromName: acc.from_name }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                        form.smtpAccountId === acc.id
                          ? 'border-blue-500/40 bg-blue-500/10'
                          : 'border-white/[0.07] hover:border-white/[0.14]'
                      }`}>
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-black shrink-0">
                        {acc.from_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{acc.from_name}</p>
                        <p className="text-slate-500 text-[10px] truncate">{acc.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {smtpAccounts.length === 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-xs">
                ⚠️ No SMTP accounts connected. Go to <strong>SMTP Inboxes</strong> to add one.
              </div>
            )}

            {/* To / From Fields */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="To Email *"  value={form.toEmail}   onChange={f('toEmail')}   placeholder="recipient@company.com" type="email" />
                <Field label="To Name"     value={form.toName}    onChange={f('toName')}    placeholder="John Smith" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="From Email *" value={form.fromEmail} onChange={f('fromEmail')} placeholder="you@company.com" type="email" />
                <Field label="From Name *"  value={form.fromName}  onChange={f('fromName')}  placeholder="Your Name" />
              </div>
              <Field label="Reply To"      value={form.replyTo}   onChange={f('replyTo')}   placeholder="replies@company.com" type="email" />
            </div>

            {/* Subject + Body */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 space-y-3">
              {/* Template picker */}
              {templates.length > 0 && (
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1.5">Load Template</label>
                  <select
                    onChange={e => {
                      const t = templates.find(t => t.id === e.target.value)
                      if (t) setForm(p => ({ ...p, subject: t.subject, body: t.body }))
                    }}
                    className="w-full bg-[#0c0c18] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs focus:outline-none">
                    <option value="">— Select a template —</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}

              <Field label="Subject *" value={form.subject} onChange={f('subject')} placeholder="Quick question for {{firstName}}" />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-400 text-xs font-semibold">Message *</label>
                  <span className="text-slate-600 text-[10px]">Use {'{{firstName}}'}, {'{{company}}'} for personalization</span>
                </div>
                <textarea
                  value={form.body} onChange={e => f('body')(e.target.value)}
                  rows={10} placeholder={`Hi {{firstName}},\n\nI noticed {{company}} has been growing fast...\n\nWorth a 15-min chat?\n\n[Your name]`}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/50 transition-all resize-none font-mono text-xs leading-relaxed"
                />
              </div>
            </div>

            {/* Scheduling */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
              <label className="block text-slate-400 text-xs font-semibold mb-1.5">Schedule (leave empty to send immediately)</label>
              <input
                type="datetime-local" value={form.scheduledAt} onChange={e => f('scheduledAt')(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={sending || !form.toEmail || !form.subject || !form.body}
              className="w-full bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 disabled:opacity-40 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-3 text-sm"
            >
              {sending
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Queuing email...</>
                : <>✉️ {form.scheduledAt ? 'Schedule Email' : 'Send Now'}</>
              }
            </button>
          </div>
        )}

        {/* ── QUEUE / SENT / FAILED TABS ─────────────────── */}
        {tab !== 'compose' && (
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <QueueTable
                  emails={queue.filter(e => {
                    if (tab === 'queue')  return [EMAIL_STATUS.PENDING, EMAIL_STATUS.PROCESSING].includes(e.status)
                    if (tab === 'sent')   return [EMAIL_STATUS.SENT, EMAIL_STATUS.DELIVERED].includes(e.status)
                    if (tab === 'failed') return [EMAIL_STATUS.FAILED, EMAIL_STATUS.PERMANENTLY_FAILED, EMAIL_STATUS.BOUNCED].includes(e.status)
                    return true
                  })}
                  tab={tab}
                  onRetry={retryEmail}
                  onCancel={cancelEmail}
                />
                {queue.length === 0 && (
                  <div className="text-center py-20 text-slate-600">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="font-semibold">No emails in queue</p>
                    <p className="text-xs mt-1">Compose and send your first email</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-slate-400 text-xs font-semibold mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
      />
    </div>
  )
}

function QueueTable({ emails, tab, onRetry, onCancel }) {
  if (!emails.length) return (
    <div className="text-center py-16 text-slate-600">
      <div className="text-3xl mb-2">{tab === 'sent' ? '✅' : tab === 'failed' ? '❌' : '📥'}</div>
      <p className="text-sm">No emails here</p>
    </div>
  )

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {['To', 'Subject', 'Status', 'Scheduled', 'Opens', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-slate-500 text-xs font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {emails.map(email => (
            <tr key={email.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-3">
                <p className="text-white text-xs font-semibold">{email.to_name || email.to_email}</p>
                <p className="text-slate-500 text-[10px]">{email.to_email}</p>
              </td>
              <td className="px-4 py-3">
                <p className="text-slate-300 text-xs truncate max-w-[200px]">{email.subject}</p>
                <p className="text-slate-600 text-[10px]">{email.campaigns?.name || 'Manual send'}</p>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLOR[email.status] || 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                  {email.status}
                </span>
                {email.error_message && (
                  <p className="text-red-400 text-[9px] mt-1 max-w-[120px] truncate" title={email.error_message}>{email.error_message}</p>
                )}
              </td>
              <td className="px-4 py-3 text-slate-500 text-xs">{timeAgo(email.scheduled_at)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {email.opened  && <span className="text-blue-400 text-[10px]">👁 Opened</span>}
                  {email.clicked && <span className="text-violet-400 text-[10px]">🖱 Clicked</span>}
                  {email.replied && <span className="text-emerald-400 text-[10px]">💬 Replied</span>}
                  {!email.opened && !email.clicked && !email.replied && <span className="text-slate-600 text-[10px]">—</span>}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {[EMAIL_STATUS.FAILED, EMAIL_STATUS.PERMANENTLY_FAILED].includes(email.status) && (
                    <button onClick={() => onRetry(email.id)}
                      className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-lg border border-blue-500/20 transition-all">
                      Retry
                    </button>
                  )}
                  {email.status === EMAIL_STATUS.PENDING && (
                    <button onClick={() => onCancel(email.id)}
                      className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold rounded-lg border border-red-500/20 transition-all">
                      Cancel
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
