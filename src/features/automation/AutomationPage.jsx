import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useWorkspace } from '../../providers/WorkspaceProvider';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

const TRIGGER_OPTIONS = [
  { id: 'reply',      label: 'Lead Replies',          icon: '💬', desc: 'Fires when a lead replies to any email' },
  { id: 'open',       label: 'Email Opened 3×',        icon: '👁', desc: 'Fires when an email is opened 3+ times' },
  { id: 'no_reply',   label: 'No Reply in 7 Days',     icon: '⏰', desc: 'Auto follow-up if no response received' },
  { id: 'status',     label: 'Status Changed to Won',  icon: '🏆', desc: 'Fires when a lead is marked as Won' },
];

const ACTION_OPTIONS = [
  { id: 'send_email',    label: 'Send Email',         icon: '📧' },
  { id: 'update_status', label: 'Update Lead Status', icon: '✏️' },
  { id: 'notify',        label: 'Send Notification',  icon: '🔔' },
  { id: 'add_tag',       label: 'Add Tag to Lead',    icon: '🏷' },
];

const SAMPLE_AUTOMATIONS = [
  { id: 'a1', name: 'Reply → Mark Interested',  trigger: 'reply',    action: 'update_status', status: 'ACTIVE',  runs: 12 },
  { id: 'a2', name: 'Hot Lead Notifier',         trigger: 'open',     action: 'notify',        status: 'ACTIVE',  runs: 3 },
  { id: 'a3', name: '7-Day Follow-up',           trigger: 'no_reply', action: 'send_email',    status: 'PAUSED',  runs: 0 },
];

export default function AutomationPage() {
  const { currentWorkspace } = useWorkspace();
  const [automations, setAutomations] = useState(SAMPLE_AUTOMATIONS);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', trigger: '', action: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const createAutomation = async () => {
    if (!form.name || !form.trigger || !form.action) {
      showToast('Fill all fields', 'error'); return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    const newAuto = { id: 'a' + Date.now(), name: form.name, trigger: form.trigger, action: form.action, status: 'ACTIVE', runs: 0 };
    setAutomations(prev => [newAuto, ...prev]);
    setForm({ name: '', trigger: '', action: '' });
    setShowCreate(false); setSaving(false);
    showToast('Automation created! ⚡');
  };

  const toggle = (id) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : a));
    showToast('Automation updated');
  };

  const remove = (id) => {
    setAutomations(prev => prev.filter(a => a.id !== id));
    showToast('Automation deleted', 'info');
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-transparent">
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-5 py-3.5 rounded-2xl text-sm font-bold shadow-xl border backdrop-blur-xl ${toast.type === 'error' ? 'bg-red-50/90 text-red-600 border-red-200' : 'bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto">
        <div>
          <h2 className="text-[#1D1D1F] font-black text-3xl tracking-tight">Automation</h2>
          <p className="text-[#86868B] text-sm mt-1 font-medium">
            {automations.filter(a => a.status === 'ACTIVE').length} active · {automations.length} total
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} variant="primary" className="gap-2">
          + New Automation
        </Button>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-4 mb-8 max-w-5xl mx-auto">
        {[['1. Trigger', 'Define when the automation fires', '⚡'],['2. Action', 'What happens automatically', '⚙️'],['3. Result', 'Track runs & outcomes', '📊']].map(([title, desc, icon]) => (
          <Card key={title} className="p-5">
            <div className="text-3xl mb-3">{icon}</div>
            <p className="text-[#1D1D1F] font-bold text-base mb-1 tracking-tight">{title}</p>
            <p className="text-[#86868B] text-sm font-medium">{desc}</p>
          </Card>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="p-6 mb-8 max-w-5xl mx-auto border-[#0066CC]/20 shadow-[0_8px_30px_rgb(0,102,204,0.08)]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5">
            <p className="text-[#1D1D1F] font-black text-xl tracking-tight">Create New Automation</p>
            <button onClick={() => setShowCreate(false)} className="text-[#86868B] hover:text-[#1D1D1F] transition-colors p-2 hover:bg-black/5 rounded-full">
              ✕
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-[#1D1D1F] text-sm font-bold mb-2">Automation Name</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Reply → Book Meeting" />
            </div>
            <div>
              <label className="block text-[#1D1D1F] text-sm font-bold mb-3">Trigger</label>
              <div className="grid grid-cols-2 gap-3">
                {TRIGGER_OPTIONS.map(t => (
                  <button key={t.id} onClick={() => setForm(f => ({ ...f, trigger: t.id }))}
                    className={`text-left p-4 rounded-xl border transition-all duration-300 ${form.trigger === t.id ? 'bg-[#0066CC]/10 border-[#0066CC]/30 text-[#0066CC] shadow-inner' : 'bg-white border-black/10 text-[#86868B] hover:border-black/20 hover:bg-[#F5F5F7]'}`}>
                    <div className="flex items-center mb-1">
                      <span className="text-2xl mr-3">{t.icon}</span>
                      <span className={`text-sm font-bold ${form.trigger === t.id ? 'text-[#0066CC]' : 'text-[#1D1D1F]'}`}>{t.label}</span>
                    </div>
                    <p className={`text-xs ml-9 ${form.trigger === t.id ? 'text-[#0066CC]/80' : 'text-[#86868B]'}`}>{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[#1D1D1F] text-sm font-bold mb-3">Action</label>
              <div className="grid grid-cols-2 gap-3">
                {ACTION_OPTIONS.map(a => (
                  <button key={a.id} onClick={() => setForm(f => ({ ...f, action: a.id }))}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${form.action === a.id ? 'bg-[#AF52DE]/10 border-[#AF52DE]/30 text-[#AF52DE] shadow-inner' : 'bg-white border-black/10 text-[#86868B] hover:border-black/20 hover:bg-[#F5F5F7]'}`}>
                    <span className="text-2xl">{a.icon}</span>
                    <span className={`text-sm font-bold ${form.action === a.id ? 'text-[#AF52DE]' : 'text-[#1D1D1F]'}`}>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-black/5 mt-6">
              <Button onClick={() => setShowCreate(false)} variant="secondary">Cancel</Button>
              <Button onClick={createAutomation} variant="primary" disabled={saving || !form.name || !form.trigger || !form.action}>
                {saving ? 'Creating…' : 'Create Automation'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Automations List */}
      <div className="space-y-4 max-w-5xl mx-auto">
        {automations.map(a => {
          const trigger = TRIGGER_OPTIONS.find(t => t.id === a.trigger);
          const action = ACTION_OPTIONS.find(ac => ac.id === a.action);
          return (
            <Card key={a.id} className="p-6 flex items-center gap-5 hover:border-black/10 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-[#1D1D1F] font-bold text-lg tracking-tight">{a.name}</p>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${a.status === 'ACTIVE' ? 'text-[#34C759] bg-[#34C759]/10 border border-[#34C759]/20' : 'text-[#FF9500] bg-[#FF9500]/10 border border-[#FF9500]/20'}`}>
                    {a.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#86868B] font-medium">
                  {trigger && <span className="flex items-center gap-1.5"><span className="text-base">{trigger.icon}</span> {trigger.label}</span>}
                  <span className="text-black/20 font-bold">→</span>
                  {action && <span className="flex items-center gap-1.5"><span className="text-base">{action.icon}</span> {action.label}</span>}
                  <span className="text-black/20 font-bold">·</span>
                  <span className="bg-[#F5F5F7] px-2 py-0.5 rounded-md text-[#1D1D1F] font-bold">{a.runs} runs</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Button onClick={() => toggle(a.id)}
                  variant="secondary" className={a.status === 'ACTIVE' ? 'text-[#FF9500] hover:text-[#FF9500]' : 'text-[#34C759] hover:text-[#34C759]'}>
                  {a.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                </Button>
                <Button onClick={() => remove(a.id)} variant="danger" className="text-red-600 bg-red-50 hover:bg-red-100 border-red-100 hover:border-red-200">
                  Delete
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
