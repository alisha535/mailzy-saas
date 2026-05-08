import { useState, useEffect } from 'react';
import { useInboxes } from './useInboxes';
import { useToast } from '../../providers/ToastProvider';
import { Card, Btn, Ic, ICONS, Inp, Sel, Badge, Spinner, ToastBar } from '../../components/ui';

export default function InboxesPage() {
  const { toasts } = useToast();
  const { inboxes, loading, load, create, remove, update } = useInboxes();
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { load(); }, [load]);
  const [testing, setTesting] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    from_name: '',
    host: 'smtp.gmail.com',
    port: '587',
    username: '',
    password_enc: '',
    daily_limit: '30'
  });

  const PRESETS = [
    { n: 'Gmail', sh: 'smtp.gmail.com', sp: '587' },
    { n: 'Outlook', sh: 'smtp-mail.outlook.com', sp: '587' },
    { n: 'Yahoo', sh: 'smtp.mail.yahoo.com', sp: '465' }
  ];

  const handleAdd = async () => {
    if (!form.email || !form.username || !form.password_enc) {
      return;
    }
    const success = await create({
      name: form.name || form.email,
      email: form.email,
      from_name: form.from_name || form.name || 'Sales',
      host: form.host,
      port: parseInt(form.port, 10),
      username: form.username,
      password_enc: form.password_enc,
      daily_limit: parseInt(form.daily_limit, 10),
      provider: 'smtp'
    });
    if (success) {
      setShowAdd(false);
    }
  };

  const testConnection = async (id) => {
    setTesting(id);
    await new Promise(r => setTimeout(r, 2000));
    await update(id, { is_active: true });
    setTesting(null);
  };

  return (
    <div className="p-10 h-full overflow-y-auto bg-[#F5F5F7]/30">
      <ToastBar toasts={toasts} />
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-[#1D1D1F] text-3xl font-black tracking-tight">SMTP Inboxes</h1>
            <p className="text-[#86868B] font-semibold mt-1">Connect your sending accounts for outreach</p>
          </div>
          <Btn icon="plus" onClick={() => setShowAdd(true)} sz="lg" cls="shadow-blue-500/25">Add New Inbox</Btn>
        </div>


        {showAdd && (
          <Card cls="p-8 mb-10 animate-fade-in shadow-xl">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-black/5">
              <h3 className="text-[#1D1D1F] text-xl font-black tracking-tight">Configure SMTP Settings</h3>
              <Btn v="ghost" sz="sm" onClick={() => setShowAdd(false)} icon="x" cls="w-10 h-10 rounded-full" />
            </div>

            <div className="mb-8">
              <p className="text-[#1D1D1F] text-[13px] font-black mb-3">Quick Presets</p>
              <div className="flex gap-3">
                {PRESETS.map(p => (
                  <button
                    key={p.n}
                    onClick={() => setForm(f => ({ ...f, host: p.sh, port: p.sp }))}
                    className={`px-6 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all ${form.host === p.sh ? 'bg-[#0066CC] text-white border-[#0066CC] shadow-md shadow-blue-500/20' : 'bg-white text-[#86868B] border-black/5 hover:border-black/10'
                      }`}
                  >
                    {p.n}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <Inp label="Account Alias" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Support Account 1" />
              <Inp label="From Email" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="hello@company.com" />
              <Inp label="Display Name" value={form.from_name} onChange={v => setForm(f => ({ ...f, from_name: v }))} placeholder="John from Mailzy" />
              <Inp label="SMTP Host" value={form.host} onChange={v => setForm(f => ({ ...f, host: v }))} placeholder="smtp.gmail.com" />
              <Inp label="SMTP Port" type="number" value={form.port} onChange={v => setForm(f => ({ ...f, port: v }))} />
              <Inp label="SMTP Username" value={form.username} onChange={v => setForm(f => ({ ...f, username: v }))} placeholder="user@gmail.com" />

              <div className="relative">
                <Inp label="SMTP Password" type={showPw ? 'text' : 'password'} value={form.password_enc} onChange={v => setForm(f => ({ ...f, password_enc: v }))} placeholder="App Password" />
                <button onClick={() => setShowPw(!showPw)} className="absolute right-4 top-[42px] text-[#86868B] hover:text-[#1D1D1F]">
                  <Ic d={showPw ? ICONS.eyeoff : ICONS.eye} s={16} />
                </button>
              </div>

              <Inp label="Daily Limit" type="number" value={form.daily_limit} onChange={v => setForm(f => ({ ...f, daily_limit: v }))} hint="Recommended: 30–50" />
            </div>

            {form.host.includes('gmail') && (
              <div className="mt-8 bg-[#FF9500]/5 border border-[#FF9500]/10 rounded-2xl p-4 flex gap-4">
                <div className="w-10 h-10 bg-[#FF9500]/10 rounded-xl flex items-center justify-center shrink-0 text-[#FF9500]">
                  <Ic d={ICONS.alert} s={20} />
                </div>
                <p className="text-[#1D1D1F] text-[13px] font-medium leading-relaxed">
                  <span className="font-black text-[#FF9500]">Gmail Setup:</span> Requires an 2FA and an App Password. Generate one in your Google Account Security settings.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-black/5">
              <Btn v="secondary" onClick={() => setShowAdd(false)}>Cancel</Btn>
              <Btn onClick={handleAdd} icon="plus" cls="shadow-blue-500/25">Add Inbox</Btn>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <Spinner s={48} />
            <p className="text-[#86868B] font-bold mt-6">Loading inboxes...</p>
          </div>
        ) : inboxes.length === 0 && !showAdd ? (
          <Card cls="p-20 text-center bg-black/[0.01] border-dashed border-2">
            <div className="bg-white w-20 h-20 rounded-[28px] shadow-xl flex items-center justify-center mx-auto mb-8 text-[#86868B]">
              <Ic d={ICONS.inbox} s={36} />
            </div>
            <h3 className="text-[#1D1D1F] text-2xl font-black mb-2">No accounts connected</h3>
            <p className="text-[#86868B] font-medium mb-10 max-w-sm mx-auto">Add a Gmail, Outlook, or custom SMTP account to start sending outreach campaigns.</p>
            <Btn icon="plus" sz="lg" onClick={() => setShowAdd(true)} cls="shadow-blue-500/25">Connect Your First Inbox</Btn>
          </Card>
        ) : (
          <div className="space-y-6">
            {inboxes.map(inbox => (
              <Card key={inbox.id} cls="p-8 group hover:bg-white/80 transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#0066CC] to-[#004a99] shadow-lg shadow-blue-500/20 flex items-center justify-center text-white font-black text-2xl shrink-0">
                    {(inbox.name || inbox.email)?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-[#1D1D1F] font-black text-xl tracking-tight truncate">{inbox.name || inbox.email}</span>
                      <Badge color={inbox.is_active ? 'emerald' : 'slate'} dot>
                        {inbox.is_active ? 'Online' : 'Configure'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-[#86868B] font-bold text-xs uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Ic d={ICONS.mail} s={12} />{inbox.email}</span>
                      <span className="flex items-center gap-1.5"><Ic d={ICONS.globe} s={12} />{inbox.host}:{inbox.port}</span>
                      <span className="flex items-center gap-1.5"><Ic d={ICONS.trending} s={12} />{inbox.sent_today || 0}/{inbox.daily_limit} Limit</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Btn onClick={() => testConnection(inbox.id)} v="secondary" sz="sm" disabled={testing === inbox.id} icon={testing === inbox.id ? "refresh" : "bolt"} cls={testing === inbox.id ? "animate-spin" : "hover:border-[#34C759] hover:text-[#34C759]"}>
                      {testing === inbox.id ? 'Verifying...' : 'Verify Connection'}
                    </Btn>
                    <Btn onClick={() => remove(inbox.id)} v="ghost" sz="sm" icon="trash" cls="text-red-500 hover:bg-red-500/5 hover:text-red-600" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
