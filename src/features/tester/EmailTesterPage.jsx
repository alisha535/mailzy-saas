import { useState } from 'react';
import { Card, Btn, Ic, ICONS, Badge, Spinner, Inp } from '../../components/ui';

const SPAM_WORDS = ['free', 'guaranteed', 'winner', 'cash', 'prize', 'click here', 'limited time', 'act now', 'buy now', 'earn money', 'make money', 'no cost', 'risk free', '100%', '!!', '$$$'];
const BEST_PRACTICES = [
  { id: 'subject_len', label: 'Subject line is 6–10 words', check: (s) => { const w = s.split(' ').filter(Boolean).length; return w >= 6 && w <= 10; } },
  { id: 'has_name', label: 'Personalization token used', check: (_, b) => /\{\{(firstName|name|company)\}\}/i.test(b) },
  { id: 'no_spam', label: 'No spam trigger words', check: (s, b) => !SPAM_WORDS.some(w => (s + ' ' + b).toLowerCase().includes(w)) },
  { id: 'word_count', label: 'Body is 50–150 words', check: (_, b) => { const w = b.trim().split(/\s+/).length; return w >= 50 && w <= 150; } },
  { id: 'has_cta', label: 'Contains a call to action', check: (_, b) => /\?|call|chat|meeting|book|schedule|reply|let me know/i.test(b) },
  { id: 'has_sig', label: 'Ends with a sign-off', check: (_, b) => /best|regards|cheers|sincerely|thanks|warm/i.test(b) },
];

export default function EmailTesterPage() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [results, setResults] = useState(null);
  const [testing, setTesting] = useState(false);

  const runTest = async () => {
    if (!subject.trim() || !body.trim()) return;
    setTesting(true);
    await new Promise(r => setTimeout(r, 900));

    const checks = BEST_PRACTICES.map(bp => ({ ...bp, passed: bp.check(subject, body) }));
    const spamFound = SPAM_WORDS.filter(w => (subject + ' ' + body).toLowerCase().includes(w));
    const score = Math.round((checks.filter(c => c.passed).length / checks.length) * 100);
    const wordCount = body.trim().split(/\s+/).length;
    const subjectWords = subject.trim().split(' ').filter(Boolean).length;

    setResults({ checks, spamFound, score, wordCount, subjectWords });
    setTesting(false);
  };

  const scoreColor = results
    ? results.score >= 80 ? 'text-emerald-400' : results.score >= 60 ? 'text-amber-400' : 'text-red-400'
    : 'text-white';

  return (
    <div className="p-10 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-[#1D1D1F] text-3xl font-black tracking-tight">Email Tester</h1>
          <p className="text-[#86868B] font-medium mt-1">Test your cold email for deliverability, spam score, and best practices</p>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Input Panel */}
          <div className="col-span-7 space-y-6">
            <Card cls="p-8">
              <div className="space-y-6">
                <div>
                  <Inp label="Subject Line" value={subject} onChange={setSubject}
                    placeholder="Quick question for {{firstName}}"
                    hint={`${subject.split(' ').filter(Boolean).length} words`} />
                </div>

                <div>
                  <Inp label="Email Body" value={body} onChange={setBody}
                    placeholder={'Hi {{firstName}},\n\nI noticed {{company}} is...\n\n[Your personalized message]\n\nBest,\n[Your name]'}
                    rows={12}
                    hint={`${body.trim().split(/\s+/).filter(Boolean).length} words`} />
                </div>

                <div className="pt-4">
                  <Btn onClick={runTest} disabled={testing || !subject.trim() || !body.trim()} sz="lg" cls="w-full shadow-blue-500/25">
                    {testing ? <Spinner s={16} /> : '🧪 Run Email Analysis'}
                  </Btn>
                </div>
              </div>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="col-span-5">
            {!results ? (
              <Card cls="p-12 flex flex-col items-center justify-center text-center h-full border-dashed bg-black/[0.01]">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-4xl mb-6 animate-bounce">
                  🧪
                </div>
                <p className="text-[#1D1D1F] text-xl font-black mb-2">No analysis yet</p>
                <p className="text-[#86868B] font-medium">Write your email and click "Run Email Analysis" to see results</p>
              </Card>
            ) : (
              <div className="space-y-6 animate-fade-in">
                {/* Score */}
                <Card cls="p-8 text-center relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${results.score >= 80 ? 'bg-[#34C759]' : results.score >= 60 ? 'bg-[#FF9500]' : 'bg-[#FF3B30]'}`} />
                  <p className={`text-7xl font-black mb-2 tracking-tighter ${results.score >= 80 ? 'text-[#34C759]' : results.score >= 60 ? 'text-[#FF9500]' : 'text-[#FF3B30]'}`}>
                    {results.score}
                  </p>
                  <p className="text-[#1D1D1F] font-black uppercase tracking-widest text-xs">Quality Score</p>

                  <div className="mt-6 flex justify-between gap-3">
                    <div className="flex-1 bg-[#F5F5F7] rounded-2xl p-4">
                      <p className="text-[#1D1D1F] text-xl font-black">{results.wordCount}</p>
                      <p className="text-[#86868B] text-[10px] font-black uppercase">Body Words</p>
                    </div>
                    <div className="flex-1 bg-[#F5F5F7] rounded-2xl p-4">
                      <p className="text-[#1D1D1F] text-xl font-black">{results.subjectWords}</p>
                      <p className="text-[#86868B] text-[10px] font-black uppercase">Subj Words</p>
                    </div>
                  </div>
                </Card>

                {/* Checklist */}
                <Card cls="p-6">
                  <h3 className="text-[#1D1D1F] font-black text-sm mb-4 flex items-center gap-2">
                    <Ic d={ICONS.chart} s={16} /> Best Practices
                  </h3>
                  <div className="space-y-3">
                    {results.checks.map(c => (
                      <div key={c.id} className="flex items-center gap-4 group">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${c.passed ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'}`}>
                          {c.passed ? '✓' : '×'}
                        </div>
                        <span className={`text-[13px] font-medium transition-colors ${c.passed ? 'text-[#1D1D1F]' : 'text-[#86868B]'}`}>
                          {c.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Spam Words */}
                {results.spamFound.length > 0 && (
                  <Card cls="p-6 bg-[#FF3B30]/5 border-[#FF3B30]/10">
                    <h3 className="text-[#FF3B30] font-black text-xs mb-3 flex items-center gap-2 uppercase tracking-wider">
                      <Ic d={ICONS.alert} s={14} /> Spam Trigger Words
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {results.spamFound.map(w => (
                        <Badge key={w} color="red">{w}</Badge>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
