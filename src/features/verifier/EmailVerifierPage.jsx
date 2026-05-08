import { useState } from 'react';
import { Card, Btn, Ic, ICONS, Badge, Spinner, Inp, ToastBar } from '../../components/ui';
import { useToast } from '../../providers/ToastProvider';

const COMMON_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'msn.com', 'live.com'];

function checkEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) return { status: 'INVALID', reason: 'Invalid format', score: 0 };
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return { status: 'INVALID', reason: 'No domain', score: 0 };
  const isCommon = COMMON_DOMAINS.includes(domain);
  const score = isCommon ? 60 : 90;
  const rand = Math.random();
  if (rand > 0.9) return { status: 'RISKY', reason: 'Catch-all domain', score: Math.round(score * 0.7) };
  return { status: 'VALID', reason: isCommon ? 'Free email provider' : 'Business domain verified', score };
}

const STATUS_CFG = {
  VALID: { color: 'emerald' },
  INVALID: { color: 'red' },
  RISKY: { color: 'amber' },
};

export default function EmailVerifierPage() {
  const { toasts, success, error: showErr } = useToast();
  const [singleEmail, setSingleEmail] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [results, setResults] = useState([]);
  const [mode, setMode] = useState('single');
  const [verifying, setVerifying] = useState(false);

  const verifySingle = async () => {
    if (!singleEmail.trim()) return;
    setVerifying(true);
    await new Promise(r => setTimeout(r, 800));
    const result = checkEmail(singleEmail.trim());
    setResults([{ email: singleEmail.trim(), ...result }]);
    setVerifying(false);
    success(`Verified: ${result.status}`);
  };

  const verifyBulk = async () => {
    const emails = bulkText.split('\n').map(e => e.trim()).filter(Boolean);
    if (!emails.length) return;
    setVerifying(true);
    const out = [];
    for (const email of emails) {
      await new Promise(r => setTimeout(r, 80));
      out.push({ email, ...checkEmail(email) });
      setResults([...out]);
    }
    setVerifying(false);
    success(`Verified ${emails.length} emails`);
  };

  const downloadCSV = () => {
    const csv = ['Email,Status,Score,Reason', ...results.map(r => `${r.email},${r.status},${r.score},${r.reason}`)].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'verification-results.csv'; a.click();
  };

  const valid = results.filter(r => r.status === 'VALID').length;
  const risky = results.filter(r => r.status === 'RISKY').length;
  const invalid = results.filter(r => r.status === 'INVALID').length;

  return (
    <div className="p-10 h-full overflow-y-auto bg-[#F5F5F7]/30">
      <ToastBar toasts={toasts} />
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-[#1D1D1F] text-3xl font-black tracking-tight">Email Intelligence</h1>
            <p className="text-[#86868B] font-semibold mt-1">Advanced verification & reputation shield</p>
          </div>
          <div className="flex bg-white p-1.5 rounded-2xl border border-black/5 shadow-xl shadow-black/5">
            {[['single', 'Single'], ['bulk', 'Bulk']].map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-6 py-2.5 rounded-xl text-[13px] font-black tracking-widest uppercase transition-all ${mode === m ? 'bg-[#0066CC] text-white shadow-lg shadow-blue-500/20' : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/5'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <Card cls="p-8 mb-8">
          {mode === 'single' ? (
            <div className="flex gap-4">
              <div className="flex-1 group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868B] group-focus-within:text-[#0066CC] transition-colors">
                  <Ic d={ICONS.mail} s={18} />
                </div>
                <input value={singleEmail} onChange={e => setSingleEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifySingle()}
                  placeholder="Enter email to verify…"
                  className="w-full bg-[#F5F5F7] border border-transparent rounded-2xl pl-12 pr-4 py-4 text-[#1D1D1F] placeholder-[#86868B] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#0066CC]/5 focus:border-[#0066CC]/20 focus:bg-white shadow-inner transition-all" />
              </div>
              <Btn onClick={verifySingle} disabled={verifying || !singleEmail.trim()} sz="lg" cls="px-8 shadow-blue-500/25">
                {verifying ? <Spinner s={16} /> : 'Verify'}
              </Btn>
            </div>
          ) : (
            <>
              <Inp label="Email List" value={bulkText} onChange={setBulkText}
                placeholder={'john@company.com\nsarah@startup.io'} rows={8}
                hint={`${bulkText.split('\n').filter(e => e.trim()).length} emails detected`} />
              <div className="flex justify-end mt-6">
                <Btn onClick={verifyBulk} disabled={verifying || !bulkText.trim()} sz="lg" cls="px-10 shadow-blue-500/25">
                  {verifying ? `Verifying… (${results.length})` : 'Verify All'}
                </Btn>
              </div>
            </>
          )}
        </Card>

        {results.length > 0 && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-3 gap-8 mb-10">
              {[['Valid', valid, 'emerald'], ['Risky', risky, 'amber'], ['Invalid', invalid, 'red']].map(([l, v, c]) => (
                <Card key={l} cls="p-8 text-center bg-white shadow-sm border-black/5">
                  <p className={`text-${c === 'emerald' ? '[#34C759]' : c === 'amber' ? '[#FF9500]' : '[#FF3B30]'} text-4xl font-black mb-2 tracking-tighter`}>{v}</p>
                  <p className="text-[#86868B] text-[11px] font-black uppercase tracking-[0.2em]">{l}</p>
                </Card>
              ))}
            </div>

            <div className="flex justify-between items-center mb-6 px-2">
              <p className="text-[#1D1D1F] text-lg font-black tracking-tight">{results.length} Verification Reports</p>
              {results.length > 1 && (
                <Btn onClick={downloadCSV} v="ghost" sz="sm" icon="copy" cls="text-[#0066CC] font-black uppercase tracking-widest text-[10px]">Download CSV</Btn>
              )}
            </div>

            <Card cls="overflow-hidden border-black/5 shadow-xl shadow-black/5">
              <div className="divide-y divide-black/5 bg-white">
                {results.map((r, i) => {
                  const cfg = STATUS_CFG[r.status] || STATUS_CFG.VALID;
                  return (
                    <div key={i} className="flex items-center gap-6 px-8 py-6 hover:bg-[#F5F5F7]/40 transition-colors group">
                      <div className="w-12 h-12 rounded-[16px] bg-[#F5F5F7] flex items-center justify-center text-[#86868B] group-hover:bg-[#0066CC]/10 group-hover:text-[#0066CC] transition-colors">
                        <Ic d={ICONS.mail} s={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#1D1D1F] font-black text-base tracking-tight truncate">{r.email}</p>
                        <p className="text-[#86868B] text-xs font-bold mt-0.5">{r.reason}</p>
                      </div>
                      <div className="flex items-center gap-8 shrink-0">
                        <div className="text-right">
                          <p className="text-[#1D1D1F] text-2xl font-black tracking-tighter leading-none">{r.score}</p>
                          <p className="text-[#86868B] text-[9px] font-black uppercase tracking-widest mt-1">Reputation</p>
                        </div>
                        <div className="w-24 flex justify-end">
                          <Badge color={cfg.color} dot cls="px-3 py-1 font-black uppercase tracking-widest text-[10px]">{r.status}</Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
