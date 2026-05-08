import { useEffect, useState } from 'react'
import { useCampaigns } from './useCampaigns'
import { useLeads } from '../leads/useLeads'
import { useWorkspace } from '../../providers/WorkspaceProvider'
import { useToast } from '../../providers/ToastProvider'
import { queueCampaignEmails, triggerEmailWorker } from '../../lib/emailQueue'
import { Card, Btn, Ic, ICONS, StatusBadge, Spinner, Modal, Inp, Sel, ToastBar } from '../../components/ui'

// ── New Campaign Modal ────────────────────────────────────────
function NewCampaignModal({ open, onClose, onCreate }) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', from_name: '', from_email: '',
    daily_limit: '50',
    subject1: '', body1: '',
    subject2: '', body2: '',
  })
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    if (!form.name || !form.from_email || !form.subject1 || !form.body1) return
    setSaving(true)
    await onCreate({
      name:       form.name,
      from_name:  form.from_name,
      from_email: form.from_email,
      daily_limit: parseInt(form.daily_limit, 10),
      status: 'DRAFT',
      steps: [
        { subject: form.subject1, body: form.body1, delay_days: 0 },
        ...(form.subject2 ? [{ subject: form.subject2, body: form.body2, delay_days: 3 }] : []),
      ],
    })
    setSaving(false)
    onClose()
    setForm({ name:'', from_name:'', from_email:'', daily_limit:'50', subject1:'', body1:'', subject2:'', body2:'' })
    setStep(1)
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Campaign" w="max-w-2xl">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map(s => (
          <button key={s} onClick={() => setStep(s)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${step === s ? 'bg-[#0066CC] text-white' : 'bg-[#F5F5F7] text-[#86868B] hover:bg-black/10'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${step === s ? 'bg-white/20' : 'bg-black/10'}`}>{s}</span>
            {s === 1 ? 'Campaign Info' : 'Email Steps'}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <Inp label="Campaign Name *" value={form.name} onChange={v => upd('name', v)} placeholder="SaaS Founders Q2 Outreach" />
          <div className="grid grid-cols-2 gap-4">
            <Inp label="From Name *" value={form.from_name} onChange={v => upd('from_name', v)} placeholder="Alex from Mailzy" />
            <Inp label="From Email *" type="email" value={form.from_email} onChange={v => upd('from_email', v)} placeholder="alex@yourcompany.com" />
          </div>
          <Inp label="Daily Send Limit" type="number" value={form.daily_limit} onChange={v => upd('daily_limit', v)} hint="Recommended: 30-50 per inbox per day" />
          <div className="flex justify-end pt-2">
            <Btn onClick={() => setStep(2)} disabled={!form.name || !form.from_email}>Next: Write Emails →</Btn>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-[#0066CC]/5 border border-[#0066CC]/10 rounded-2xl p-4">
            <p className="text-[#0066CC] text-xs font-bold">💡 Use <code>{'{{firstName}}'}</code>, <code>{'{{company}}'}</code> for personalization</p>
          </div>
          <div className="space-y-4">
            <p className="text-[#1D1D1F] font-black text-sm">Step 1 — Day 0 (required)</p>
            <Inp label="Subject" value={form.subject1} onChange={v => upd('subject1', v)} placeholder="Quick question for {{firstName}}" />
            <Inp label="Email Body" value={form.body1} onChange={v => upd('body1', v)} placeholder={`Hi {{firstName}},\n\nNoticed {{company}} has been growing fast...\n\n[Your message here]\n\n[Your name]`} rows={6} />
          </div>
          <div className="space-y-4 pt-4 border-t border-black/5">
            <p className="text-[#1D1D1F] font-black text-sm">Step 2 — Day 3 (optional follow-up)</p>
            <Inp label="Subject" value={form.subject2} onChange={v => upd('subject2', v)} placeholder="Re: {{firstName}} — still relevant?" />
            <Inp label="Email Body" value={form.body2} onChange={v => upd('body2', v)} placeholder={`Hi {{firstName}},\n\nJust bumping this — happy to share a case study.\n\n[Your name]`} rows={4} />
          </div>
          <div className="flex justify-between pt-2">
            <Btn v="secondary" onClick={() => setStep(1)}>← Back</Btn>
            <Btn onClick={handleCreate} disabled={saving || !form.subject1 || !form.body1} icon={saving ? 'refresh' : 'check'}>
              {saving ? 'Creating...' : 'Create Campaign'}
            </Btn>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function CampaignsPage() {
  const { campaigns, loading, load, create, setStatus, remove } = useCampaigns()
  const { leads, load: loadLeads } = useLeads()
  const { workspace } = useWorkspace()
  const { toasts, success, error: showErr } = useToast()
  const [showNew, setShowNew] = useState(false)
  const [launching, setLaunching] = useState(null)

  useEffect(() => { load(); loadLeads() }, [load, loadLeads])

  const handleLaunch = async (campaign) => {
    if (!leads.length) { showErr('No leads found. Import leads first from the Leads page.'); return }
    setLaunching(campaign.id)
    try {
      const count = await queueCampaignEmails({ ...campaign, workspace_id: workspace.id }, leads)
      success(`✅ ${count} emails queued! The email-worker will send them shortly.`)
      await triggerEmailWorker().catch(() => {}) // fire & forget
      await load()
    } catch (err) {
      showErr(err.message)
    } finally {
      setLaunching(null)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F5F7]/30">
      <ToastBar toasts={toasts} />
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-10 bg-white/40 backdrop-blur-3xl border-b border-black/5 z-10">
        <div>
          <h1 className="text-3xl font-black text-[#1D1D1F] tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-black/5 flex items-center justify-center text-[#0066CC]">
              <Ic d={ICONS.bolt} s={24} />
            </div>
            Campaigns
          </h1>
          <p className="text-[#86868B] font-semibold mt-1 px-1">Automate your outreach at scale</p>
        </div>
        <Btn icon="plus" sz="lg" cls="shadow-blue-500/25" onClick={() => setShowNew(true)}>New Campaign</Btn>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <Card cls="overflow-hidden border-black/5">
          <table className="w-full text-left">
            <thead className="bg-[#F5F5F7]/80 backdrop-blur-md border-b border-black/5">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-[#86868B] uppercase tracking-widest">Campaign</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#86868B] uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#86868B] uppercase tracking-widest">Sent</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#86868B] uppercase tracking-widest">Opened</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#86868B] uppercase tracking-widest">Replied</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#86868B] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 bg-white/50">
              {loading ? (
                <tr><td colSpan="6" className="px-8 py-20 text-center"><Spinner s={32} /><p className="text-[#86868B] font-bold mt-4">Loading campaigns...</p></td></tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-32 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 bg-[#F5F5F7] rounded-3xl flex items-center justify-center text-[#86868B] mb-6 mx-auto">
                        <Ic d={ICONS.bolt} s={32} />
                      </div>
                      <h3 className="text-[#1D1D1F] text-xl font-black mb-2">No campaigns yet</h3>
                      <p className="text-[#86868B] font-medium mb-8">Create your first automated outreach sequence.</p>
                      <Btn v="secondary" sz="lg" onClick={() => setShowNew(true)}>Create Your First Campaign</Btn>
                    </div>
                  </td>
                </tr>
              ) : (
                campaigns.map(campaign => (
                  <tr key={campaign.id} className="hover:bg-[#F5F5F7]/40 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-[#1D1D1F] text-base font-black tracking-tight">{campaign.name}</span>
                        <span className="text-[#86868B] font-bold text-xs flex items-center gap-1.5 mt-1">
                          <Ic d={ICONS.mail} s={12} />
                          {campaign.from_email || 'No sending account set'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6"><StatusBadge status={campaign.status} /></td>
                    <td className="px-8 py-6">
                      <span className="text-[#1D1D1F] text-lg font-black">{campaign.total_sent || 0}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-[#1D1D1F] text-lg font-black">{campaign.total_opened || 0}</span>
                        <span className="text-[#86868B] font-black text-[10px]">
                          {campaign.total_sent > 0 ? Math.round((campaign.total_opened / campaign.total_sent) * 100) : 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[#0066CC] text-lg font-black">{campaign.total_replied || 0}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {campaign.status === 'DRAFT' && (
                          <Btn
                            onClick={() => handleLaunch(campaign)}
                            sz="sm" v="success" icon="play"
                            disabled={launching === campaign.id}
                          >
                            {launching === campaign.id ? 'Launching...' : 'Launch'}
                          </Btn>
                        )}
                        {campaign.status === 'ACTIVE' && (
                          <Btn onClick={() => setStatus(campaign.id, 'PAUSED')} sz="sm" v="secondary" icon="pause">Pause</Btn>
                        )}
                        {campaign.status === 'PAUSED' && (
                          <Btn onClick={() => setStatus(campaign.id, 'ACTIVE')} sz="sm" v="success" icon="play">Resume</Btn>
                        )}
                        <Btn sz="sm" v="ghost" icon="trash" cls="text-red-500 hover:bg-red-500/5 p-2"
                          onClick={() => remove(campaign.id)} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <NewCampaignModal open={showNew} onClose={() => setShowNew(false)} onCreate={create} />
    </div>
  )
}
