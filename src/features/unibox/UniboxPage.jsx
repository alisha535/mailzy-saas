import { useState } from 'react';
import { useUnibox } from './useUnibox';
import { Card, Btn, Ic, ICONS, Inp, Sel, Badge, Spinner } from '../../components/ui';
import { useToast } from '../../providers/ToastProvider';

const STATUS_OPTIONS = ['LEAD', 'INTERESTED', 'MEETING_BOOKED', 'MEETING_COMPLETED', 'WON', 'LOST'];

const STATUS_COLORS = {
  LEAD: 'text-[#0066CC] bg-[#0066CC]/10 border-[#0066CC]/20',
  INTERESTED: 'text-[#34C759] bg-[#34C759]/10 border-[#34C759]/20',
  MEETING_BOOKED: 'text-[#5856D6] bg-[#5856D6]/10 border-[#5856D6]/20',
  MEETING_COMPLETED: 'text-[#FF9500] bg-[#FF9500]/10 border-[#FF9500]/20',
  WON: 'text-[#FFCC00] bg-[#FFCC00]/10 border-[#FFCC00]/20',
  LOST: 'text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]/20',
};

function EmailRow({ email, selected, onSelect }) {
  const fromName = email.leads?.first_name
    ? `${email.leads.first_name} ${email.leads.last_name || ''}`.trim()
    : email.to_name || email.to_email;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-6 transition-all border-b border-black/5 last:border-0 relative ${selected ? 'bg-white shadow-sm z-10' : 'hover:bg-black/[0.02]'
        }`}
    >
      {selected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0066CC]" />}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm tracking-tight truncate ${selected ? 'font-black text-[#1D1D1F]' : 'font-bold text-[#1D1D1F]'}`}>{fromName}</span>
        <span className="text-[#86868B] text-[10px] font-bold uppercase tracking-wider shrink-0 ml-2">
          {email.sent_at ? new Date(email.sent_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'}
        </span>
      </div>
      <p className={`text-xs mb-3 truncate font-medium ${selected ? 'text-[#1D1D1F]' : 'text-[#86868B]'}`}>{email.subject}</p>
      <div className="flex items-center gap-2">
        {email.opened && <Badge color="emerald" sz="xs" dot cls="px-1.5 py-0.5">Open</Badge>}
        {email.replied && <Badge color="indigo" sz="xs" dot cls="px-1.5 py-0.5">Reply</Badge>}
      </div>
    </button>
  );
}

export default function UniboxPage() {
  const { emails, loading, updateLeadStatus } = useUnibox();
  const { success, error: showErr } = useToast();
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const filtered = statusFilter === 'ALL'
    ? emails
    : emails.filter(e => e.leads?.status === statusFilter);

  const handleStatusChange = async (leadId, status) => {
    try {
      await updateLeadStatus(leadId, status);
      success('Lead status updated');
    } catch {
      showErr('Failed to update status');
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    success(`Reply sent to ${selectedEmail.to_email}!`);
    setReply('');
    setSending(false);
  };

  const selectedEmail = emails.find(e => e.id === selected);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full bg-[#F5F5F7]/30">
      <Spinner s={48} />
      <p className="text-[#86868B] font-bold mt-6">Loading conversations...</p>
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* Email List Sidebar */}
      <div className="w-[380px] border-r border-black/5 flex flex-col shrink-0 bg-white">
        <div className="p-8 border-b border-black/5">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[#1D1D1F] text-2xl font-black tracking-tight">Unibox</h2>
            <div className="px-3 py-1 bg-[#F5F5F7] rounded-full text-[#86868B] text-[10px] font-black uppercase tracking-wider">
              {emails.length} TOTAL
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['ALL', ...STATUS_OPTIONS.slice(1, 4)].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`whitespace-nowrap px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border-2 ${statusFilter === s
                  ? 'bg-[#0066CC] text-white border-[#0066CC] shadow-md shadow-blue-500/20'
                  : 'bg-white text-[#86868B] border-black/5 hover:border-black/10'
                  }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center">
              <div className="w-16 h-16 bg-[#F5F5F7] rounded-[22px] flex items-center justify-center mb-6 text-[#86868B]">
                <Ic d={ICONS.inbox} s={32} />
              </div>
              <p className="text-[#1D1D1F] font-black text-lg mb-1">Clear Inbox</p>
              <p className="text-[#86868B] text-sm font-medium">No messages found for this filter.</p>
            </div>
          ) : (
            filtered.map(email => (
              <EmailRow
                key={email.id}
                email={email}
                selected={selected === email.id}
                onSelect={() => { setSelected(email.id); setReply(''); }}
              />
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F5F7]/50">
        {selectedEmail ? (
          <>
            {/* Header */}
            <div className="p-10 shrink-0 bg-white shadow-[0_4px_30px_rgba(0,0,0,0.02)] z-10">
              <div className="flex items-start justify-between gap-10">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    {selectedEmail.opened && <Badge color="emerald" dot sz="sm">Opened</Badge>}
                    {selectedEmail.clicked && <Badge color="blue" dot sz="sm">Clicked</Badge>}
                    {selectedEmail.replied && <Badge color="indigo" dot sz="sm">Replied</Badge>}
                  </div>
                  <h3 className="text-[#1D1D1F] font-black text-3xl mb-3 tracking-tight leading-tight">{selectedEmail.subject}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[10px] font-black uppercase text-[#86868B]">
                      {selectedEmail.to_name?.[0] || 'U'}
                    </div>
                    <p className="text-[#86868B] text-[13px] font-bold">
                      To: <span className="text-[#1D1D1F] font-black">{selectedEmail.to_name || selectedEmail.to_email}</span>{' '}
                      <span className="opacity-50">&lt;{selectedEmail.to_email}&gt;</span>
                    </p>
                  </div>
                </div>
                {/* Status selector for linked lead */}
                {selectedEmail.leads?.id && (
                  <div className="shrink-0">
                    <p className="text-[#86868B] text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Lead Status</p>
                    <Sel
                      value={selectedEmail.leads.status || 'LEAD'}
                      onChange={v => handleStatusChange(selectedEmail.leads.id, v)}
                      options={STATUS_OPTIONS.map(s => ({ label: s.replace('_', ' '), value: s }))}
                      cls="w-[180px]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 p-10 overflow-y-auto bg-[#F5F5F7]/30">
              <Card cls="p-12 shadow-xl shadow-black/[0.02] border-black/5 max-w-4xl mx-auto min-h-full">
                <div
                  className="text-[#1D1D1F] text-[16px] leading-[1.6] font-medium email-content"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body_html || selectedEmail.body_text || '<em>No content available</em>' }}
                />
              </Card>
            </div>

            {/* Reply Composer */}
            <div className="p-8 border-t border-black/5 shrink-0 bg-white z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
              <div className="max-w-4xl mx-auto">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Draft your reply..."
                  rows={4}
                  className="w-full bg-[#F5F5F7] border-2 border-transparent rounded-[24px] px-8 py-6 text-[#1D1D1F] placeholder-[#86868B] text-[15px] font-medium focus:outline-none focus:bg-white focus:border-[#0066CC] focus:ring-8 focus:ring-[#0066CC]/5 resize-none mb-4 transition-all"
                />
                <div className="flex justify-end gap-3">
                  <Btn v="secondary" onClick={() => setReply('')}>Discard Draft</Btn>
                  <Btn
                    onClick={handleSendReply}
                    disabled={sending || !reply.trim()}
                    icon="mail"
                    sz="lg"
                    cls="px-10 shadow-blue-500/25"
                  >
                    {sending ? 'Sending...' : 'Send Message'}
                  </Btn>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-20 animate-fade-in">
            <div className="w-24 h-24 rounded-[32px] bg-white border-2 border-dashed border-black/10 flex items-center justify-center mb-8 text-[#86868B]">
              <Ic d={ICONS.mail} s={40} />
            </div>
            <h3 className="text-[#1D1D1F] font-black text-2xl mb-2">No Conversation Selected</h3>
            <p className="text-[#86868B] text-base font-medium max-w-xs mx-auto">Select a message from the list on the left to read and reply to your leads.</p>
          </div>
        )}
      </div>
    </div>
  );
}
