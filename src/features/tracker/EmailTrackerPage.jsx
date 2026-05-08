import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useWorkspace } from '../../providers/WorkspaceProvider';
import { Card, Badge, Btn, Ic, ICONS, Spinner } from '../../components/ui';

const FILTERS = ['ALL', 'OPENED', 'UNOPENED', 'CLICKED', 'REPLIED'];

export default function EmailTrackerPage() {
  const { workspace: currentWorkspace } = useWorkspace();
  const [emails, setEmails] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load on first render
  if (!loaded && currentWorkspace) {
    setLoaded(true);
    setLoading(true);
    supabase
      .from('email_queue')
      .select('id, to_email, to_name, subject, from_email, opened, clicked, replied, bounced, sent_at, tracking_id, status')
      .eq('workspace_id', currentWorkspace.id)
      .in('status', ['SENT', 'DELIVERED', 'BOUNCED'])
      .order('sent_at', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (!error) setEmails(data || []);
        setLoading(false);
      });
  }

  const filtered = emails.filter(e => {
    const matchFilter =
      filter === 'ALL' ? true :
        filter === 'OPENED' ? e.opened :
          filter === 'UNOPENED' ? !e.opened :
            filter === 'CLICKED' ? e.clicked :
              filter === 'REPLIED' ? e.replied : true;
    const matchSearch = !search ||
      e.to_email.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const total = emails.length;
  const opened = emails.filter(e => e.opened).length;
  const clicked = emails.filter(e => e.clicked).length;
  const replied = emails.filter(e => e.replied).length;
  const openRate = total > 0 ? ((opened / total) * 100).toFixed(1) : '0.0';
  const replyRate = total > 0 ? ((replied / total) * 100).toFixed(1) : '0.0';

  const STATS = [
    { label: 'Total Tracked', value: total, icon: '📧', color: 'text-[#0066CC]', bg: 'bg-[#0066CC]/5' },
    { label: 'Opened', value: opened, sub: openRate + '%', icon: '👁', color: 'text-[#34C759]', bg: 'bg-[#34C759]/5' },
    { label: 'Clicked', value: clicked, icon: '🖱', color: 'text-[#AF52DE]', bg: 'bg-[#AF52DE]/5' },
    { label: 'Replied', value: replied, sub: replyRate + '%', icon: '💬', color: 'text-[#FF9500]', bg: 'bg-[#FF9500]/5' },
  ];

  return (
    <div className="p-6 h-full overflow-y-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-black shadow-xl border
          ${toast.type === 'error' ? 'bg-red-500/15 text-red-400 border-red-500/20' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[#1D1D1F] text-3xl font-black tracking-tight">Email Tracker</h1>
          <p className="text-[#86868B] font-medium mt-1">Real-time performance metrics for your sent emails.</p>
        </div>
        <Btn onClick={() => setLoaded(false)} v="secondary" icon="refresh">Refresh Data</Btn>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        {STATS.map(s => (
          <Card key={s.label} cls="p-6">
            <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center text-xl mb-4 shadow-sm`}>{s.icon}</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black tracking-tight ${s.color}`}>{s.value}</span>
              {s.sub && <span className="text-sm font-bold text-[#86868B]">{s.sub}</span>}
            </div>
            <p className="text-[#86868B] text-[13px] font-bold mt-1 uppercase tracking-wider">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868B] group-focus-within:text-[#0066CC] transition-colors">
            <Ic d={ICONS.search} s={18} />
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email or subject…"
            className="w-full bg-white border border-black/5 rounded-2xl pl-12 pr-4 py-3.5 text-[#1D1D1F] placeholder-[#86868B] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#0066CC]/5 focus:border-[#0066CC]/20 shadow-sm transition-all"
          />
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-black/5 shadow-sm">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${filter === f ? 'bg-[#0066CC] text-white shadow-md' : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/5'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner s={32} />
        </div>
      ) : (
        <Card cls="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F5F7]/50 border-b border-black/5">
                {['Recipient', 'Subject', 'Sent', 'Events', 'Status'].map(h => (
                  <th key={h} className="text-left text-[#86868B] text-[11px] font-black uppercase tracking-wider px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-[#86868B] font-medium">
                    {emails.length === 0 ? 'No tracked emails yet. Send a campaign to see data here.' : 'No emails match your filter.'}
                  </td>
                </tr>
              ) : (
                filtered.map(email => (
                  <tr
                    key={email.id}
                    className={`border-b border-black/5 last:border-0 hover:bg-[#F5F5F7]/50 cursor-pointer transition-colors ${selected === email.id ? 'bg-[#F5F5F7]' : ''}`}
                    onClick={() => setSelected(selected === email.id ? null : email.id)}
                  >
                    <td className="px-6 py-4">
                      <p className="text-[#1D1D1F] font-bold">{email.to_name || email.to_email}</p>
                      <p className="text-[#86868B] text-xs font-medium">{email.to_email}</p>
                    </td>
                    <td className="px-6 py-4 text-[#1D1D1F] font-medium max-w-xs truncate">{email.subject}</td>
                    <td className="px-6 py-4 text-[#86868B] text-xs font-bold">
                      {email.sent_at ? new Date(email.sent_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {email.opened && <Badge color="emerald">Opened</Badge>}
                        {email.clicked && <Badge color="blue">Clicked</Badge>}
                        {email.replied && <Badge color="violet">Replied</Badge>}
                        {email.bounced && <Badge color="red">Bounced</Badge>}
                        {!email.opened && !email.clicked && !email.replied && !email.bounced && (
                          <Badge color="slate">Sent</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge color={email.status === 'DELIVERED' ? 'emerald' : email.status === 'BOUNCED' ? 'red' : 'blue'}>
                        {email.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

    </div>
  );
}
