import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useWorkspace } from '../../providers/WorkspaceProvider';
import { useAuth } from '../../providers/AuthProvider';
import { Card, Btn, Ic, ICONS, Inp, Badge, Spinner, ToastBar } from '../../components/ui';
import { useToast } from '../../providers/ToastProvider';
import { AI } from '../../lib/constants';

const AGENT_TYPES = [
  {
    type: 'SALES',
    title: 'AI Sales Agent',
    desc: 'Fully automated outbound lead finder & outreach writer',
    color: 'blue',
    gradient: 'from-[#0066CC] to-blue-400',
    skills: ['🔍 Find ICP-matched leads automatically', '✍️ Craft personalized cold emails', '📧 Build multi-step outreach sequences', '🧠 Self-optimize from reply patterns', '🚀 Fill pipeline on autopilot'],
  },
  {
    type: 'REPLY',
    title: 'AI Reply Agent',
    desc: '24/7 intelligent reply handling & meeting booking',
    color: 'violet',
    gradient: 'from-[#5856D6] to-purple-400',
    skills: ['⚡ Auto-replies in under 5 minutes', '📊 Updates lead status & CRM', '🎯 Handles objections & questions', '📅 Books meetings automatically', '🌍 Works 24/7 globally'],
  },
];

const STATUS_COLOR = {
  ACTIVE: 'text-[#34C759] bg-[#34C759]/10 border-[#34C759]/20',
  PAUSED: 'text-[#FF9500] bg-[#FF9500]/10 border-[#FF9500]/20',
};

export default function AgentsPage() {
  const { workspace: currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { toasts, success, error: showErr } = useToast();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('list'); // list | select | name
  const [agType, setAgType] = useState(null);
  const [agName, setAgName] = useState('');
  const [creating, setCreating] = useState(false);
  const [replyInput, setReplyInput] = useState('');
  const [replyResult, setReplyResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Load agents from Supabase
  const loadAgents = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('workspace_id', currentWorkspace.id)
      .order('created_at', { ascending: false });
    if (!error) setAgents(data || []);
    setLoading(false);
  };

  // Run on mount
  useEffect(() => { loadAgents(); }, [currentWorkspace]);

  const createAgent = async () => {
    if (!agName.trim() || !currentWorkspace) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('ai_agents')
      .insert({
        workspace_id: currentWorkspace.id,
        name: agName,
        type: agType,
        status: 'ACTIVE',
      })
      .select()
      .single();
    if (!error && data) {
      setAgents(prev => [data, ...prev]);
      success(`${agName} is now live! 🤖`);
    } else {
      showErr('Failed to create agent');
    }
    setAgName(''); setStep('list'); setCreating(false);
  };

  const toggleAgent = async (agent) => {
    const newStatus = agent.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await supabase.from('ai_agents').update({ status: newStatus }).eq('id', agent.id);
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: newStatus } : a));
    success(`Agent ${newStatus === 'ACTIVE' ? 'resumed' : 'paused'}`);
  };

  const deleteAgent = async (id) => {
    await supabase.from('ai_agents').delete().eq('id', id);
    setAgents(prev => prev.filter(a => a.id !== id));
    success('Agent decommissioned');
  };

  const analyzeReply = async () => {
    if (!replyInput.trim()) return;
    setAnalyzing(true);
    try {
      // Get Groq key from profile or env
      const { data: { user } } = await supabase.auth.getUser();
      let groqKey = import.meta.env.VITE_GROQ_KEY;
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('groq_key').eq('id', user.id).single();
        groqKey = profile?.groq_key || groqKey;
      }

      if (!groqKey) throw new Error('No Groq key. Add one in Settings.');

      // Call Groq for real AI analysis
      const res = await fetch(AI.groqUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: AI.groqModel,
          max_tokens: 300,
          temperature: 0.3,
          messages: [
            { role: 'system', content: 'You are a sales reply classifier. Respond ONLY with valid JSON, no other text. Format: {"sentiment":"POSITIVE"|"NEGATIVE"|"NEUTRAL","confidence":0-100,"action":"BOOK_MEETING"|"FOLLOW_UP"|"UNSUBSCRIBE","reply":"short draft reply under 60 words"}' },
            { role: 'user', content: `Classify this email reply and draft a response:\n\n"${replyInput}"` },
          ],
        }),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim() || '{}';
      const result = JSON.parse(text);
      setReplyResult(result);
    } catch (err) {
      // Keyword fallback if Groq fails
      const positive = ['yes', 'interested', 'sure', 'love', 'great', 'call', 'meet', 'book', 'sounds good'];
      const negative = ['not interested', 'unsubscribe', 'remove', 'stop', 'wrong person'];
      const lower = replyInput.toLowerCase();
      const isPos = positive.some(w => lower.includes(w));
      const isNeg = negative.some(w => lower.includes(w));
      setReplyResult({
        sentiment: isPos ? 'POSITIVE' : isNeg ? 'NEGATIVE' : 'NEUTRAL',
        confidence: 70,
        action: isPos ? 'BOOK_MEETING' : isNeg ? 'UNSUBSCRIBE' : 'FOLLOW_UP',
        reply: isPos ? `Hi,\n\nGreat to connect! Are you free Thursday or Friday for a quick call?\n\nBest,\n[Your name]`
          : isNeg ? `Hi,\n\nNo problem at all — removing you now. Best of luck!\n\n[Your name]`
          : `Hi,\n\nHappy to answer any questions — worth a 15-min chat?\n\n[Your name]`,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  if (step === 'select') return (
    <div className="p-10 h-full overflow-y-auto bg-[#F5F5F7]/30">
      <div className="max-w-4xl mx-auto">
        <Btn v="ghost" sz="sm" onClick={() => setStep('list')} icon="chevron-left" cls="mb-8">Back to Agents</Btn>
        <div className="mb-12">
          <h2 className="text-[#1D1D1F] text-3xl font-black tracking-tight">Select Agent Specialization</h2>
          <p className="text-[#86868B] font-semibold mt-1">Choose a persona for your new AI agent</p>
        </div>
        <div className="grid grid-cols-2 gap-8">
          {AGENT_TYPES.map(ag => (
            <Card key={ag.type} hover cls="p-10 shadow-sm border-black/5 flex flex-col group cursor-pointer" onClick={() => { setAgType(ag.type); setStep('name'); }}>
              <div className={`w-20 h-20 rounded-[28px] bg-gradient-to-br ${ag.gradient} flex items-center justify-center text-4xl mb-8 shadow-xl shadow-black/5 group-hover:scale-105 transition-transform`}>
                {ag.type === 'SALES' ? '🤖' : '⚡'}
              </div>
              <h3 className="text-[#1D1D1F] font-black text-2xl mb-3 tracking-tight group-hover:text-[#0066CC] transition-colors">{ag.title}</h3>
              <p className="text-[#86868B] font-medium text-sm leading-relaxed mb-8">{ag.desc}</p>
              <div className="space-y-4 mb-10 flex-1">
                {ag.skills.map(s => (
                  <div key={s} className="flex items-center gap-3 text-[#1D1D1F] text-[13px] font-bold">
                    <div className="w-5 h-5 rounded-full bg-[#34C759]/10 flex items-center justify-center text-[#34C759]">
                      <Ic d={ICONS.check} s={10} />
                    </div>
                    {s}
                  </div>
                ))}
              </div>
              <Btn cls="w-full justify-center shadow-blue-500/25">Deploy {ag.title}</Btn>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  if (step === 'name') return (
    <div className="p-10 h-full flex flex-col items-center justify-center bg-[#F5F5F7]/30">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[#0066CC] text-white rounded-[28px] shadow-xl shadow-blue-500/20 flex items-center justify-center mx-auto mb-8 text-4xl">
            {agType === 'SALES' ? '🤖' : '⚡'}
          </div>
          <h2 className="text-[#1D1D1F] text-3xl font-black tracking-tight mb-2">Finalize Your Agent</h2>
          <p className="text-[#86868B] font-semibold">Give your {agType?.toLowerCase()} agent a unique name</p>
        </div>
        <Card cls="p-8 shadow-xl">
          <Inp
            label="Agent Name"
            value={agName}
            onChange={v => setAgName(v)}
            placeholder="e.g. Sales Pilot Pro"
            cls="mb-8"
          />
          <div className="flex justify-between items-center pt-6 border-t border-black/5">
            <Btn v="ghost" onClick={() => setStep('select')}>Change Type</Btn>
            <Btn
              onClick={createAgent}
              disabled={creating || !agName.trim()}
              icon="plus"
              sz="lg"
              cls="shadow-blue-500/25"
            >
              {creating ? 'Activating...' : 'Deploy Agent'}
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="p-10 h-full overflow-y-auto bg-[#F5F5F7]/30">
      <ToastBar toasts={toasts} />
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-[#1D1D1F] text-3xl font-black tracking-tight">AI Workforce</h1>
            <p className="text-[#86868B] font-semibold mt-1">
              Automated agents managing your growth pipeline
            </p>
          </div>
          <Btn icon="plus" onClick={() => setStep('select')} sz="lg" cls="shadow-blue-500/25">Deploy New Agent</Btn>
        </div>

        {/* Skill Overview */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Lead Discovery', icon: '🔍', color: 'bg-blue-500/10 text-blue-500', desc: 'Finding your ideal ICP' },
            { label: 'Copywriting', icon: '✍️', color: 'bg-indigo-500/10 text-indigo-500', desc: 'Writing that converts' },
            { label: 'Sentiment', icon: '🧠', color: 'bg-emerald-500/10 text-emerald-500', desc: 'Analyzing intent' },
            { label: 'Auto-Booking', icon: '📅', color: 'bg-orange-500/10 text-orange-500', desc: 'Filling your calendar' },
          ].map(skill => (
            <Card key={skill.label} cls="p-6 flex flex-col items-center text-center hover:bg-white shadow-sm transition-all group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform ${skill.color}`}>
                {skill.icon}
              </div>
              <p className="text-[#1D1D1F] text-sm font-black tracking-tight mb-1">{skill.label}</p>
              <p className="text-[#86868B] font-bold text-[11px] uppercase tracking-widest">{skill.desc}</p>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner s={48} />
            <p className="text-[#86868B] font-bold mt-6">Loading agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <Card cls="text-center py-24 bg-black/[0.01] border-2 border-dashed border-black/5 rounded-[40px] mb-10">
            <div className="w-24 h-24 bg-white rounded-[32px] shadow-xl flex items-center justify-center mx-auto mb-8 text-4xl">🤖</div>
            <h3 className="text-[#1D1D1F] font-black text-2xl mb-3">Your team is empty</h3>
            <p className="text-[#86868B] font-medium mb-10 max-w-sm mx-auto">Deploy AI agents to automate your entire outreach workflow, from discovery to booking.</p>
            <Btn sz="lg" onClick={() => setStep('select')} icon="plus" cls="shadow-blue-500/25">Hire Your First Agent</Btn>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-8 mb-10">
            {agents.map(a => {
              const typeInfo = AGENT_TYPES.find(t => t.type === a.type) || AGENT_TYPES[0];
              return (
                <Card key={a.id} cls="p-8 group hover:bg-white transition-all shadow-sm">
                  <div className="flex items-start justify-between mb-8">
                    <div className={`w-16 h-16 rounded-[22px] bg-gradient-to-br ${typeInfo.gradient} flex items-center justify-center text-3xl shadow-xl shadow-black/5`}>
                      {a.type === 'SALES' ? '🤖' : '⚡'}
                    </div>
                    <Badge color={a.status === 'ACTIVE' ? 'emerald' : 'slate'} dot cls="px-3 py-1 font-black uppercase tracking-widest text-[10px]">
                      {a.status}
                    </Badge>
                  </div>
                  <h3 className="text-[#1D1D1F] font-black text-2xl tracking-tight mb-1">{a.name}</h3>
                  <p className="text-[#86868B] text-xs font-black uppercase tracking-widest mb-8">AI {a.type === 'SALES' ? 'Outbound' : 'Reply'} Specialist</p>
                  <div className="grid grid-cols-3 gap-4 mb-8 p-6 bg-[#F5F5F7] rounded-3xl">
                    {[['Leads', a.leads_found || 0], ['Sent', a.emails_sent || 0], ['Replies', a.replies_handled || 0]].map(([l, v]) => (
                      <div key={l} className="text-center">
                        <p className="text-[#1D1D1F] font-black text-2xl tracking-tight">{v}</p>
                        <p className="text-[#86868B] text-[10px] font-black uppercase mt-1 tracking-widest">{l}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <Btn v="secondary" cls="flex-1" onClick={() => toggleAgent(a)} icon={a.status === 'ACTIVE' ? 'pause' : 'play'}>
                      {a.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                    </Btn>
                    <Btn v="ghost" icon="trash" onClick={() => deleteAgent(a.id)} cls="text-red-500 hover:bg-red-50" />
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Reply Agent Tester */}
        <Card cls="bg-[#5856D6]/5 border-2 border-[#5856D6]/10 p-10 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-[#5856D6] text-white rounded-[18px] flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Ic d={ICONS.cpu} s={24} />
            </div>
            <div>
              <h3 className="text-[#1D1D1F] text-xl font-black tracking-tight">Agent Intelligence Tester</h3>
              <p className="text-[#86868B] text-[13px] font-bold uppercase tracking-widest">Test reply sentiment analysis</p>
            </div>
          </div>

          <div className="flex gap-4 mb-8">
            <div className="flex-1">
              <Inp
                value={replyInput}
                onChange={v => setReplyInput(v)}
                placeholder="Paste an incoming email reply to analyze intent..."
              />
            </div>
            <Btn
              onClick={analyzeReply}
              disabled={analyzing || !replyInput.trim()}
              sz="lg"
              cls="px-8 shadow-indigo-500/20"
              icon={analyzing ? "refresh" : "bolt"}
            >
              {analyzing ? 'Processing...' : 'Run Analysis'}
            </Btn>
          </div>

          {replyResult && (
            <div className="grid grid-cols-2 gap-8 animate-fade-in">
              <Card cls="bg-white p-8 border-black/5 shadow-sm">
                <p className="text-[#86868B] text-[10px] font-black uppercase tracking-[0.2em] mb-6">Intent Mapping</p>
                <div className="flex items-center justify-between mb-6">
                  <p className={`font-black text-3xl tracking-tight ${replyResult.sentiment === 'POSITIVE' ? 'text-[#34C759]' : replyResult.sentiment === 'NEGATIVE' ? 'text-[#FF3B30]' : 'text-[#FF9500]'}`}>
                    {replyResult.sentiment}
                  </p>
                  <Badge color={replyResult.confidence > 80 ? 'emerald' : 'amber'} sz="sm" font="black">{replyResult.confidence}% Confidence</Badge>
                </div>
                <div className="pt-6 border-t border-black/5">
                  <p className="text-[#86868B] text-xs font-bold uppercase mb-2">Automated Action</p>
                  <p className="text-[#1D1D1F] font-black text-lg tracking-tight">{replyResult.action.replace('_', ' ')}</p>
                </div>
              </Card>
              <Card cls="bg-white p-8 border-black/5 shadow-sm">
                <p className="text-[#86868B] text-[10px] font-black uppercase tracking-[0.2em] mb-6">Smart Reply Draft</p>
                <div className="bg-[#F5F5F7] rounded-[24px] p-6 text-[#1D1D1F] text-sm font-medium leading-relaxed italic border border-black/5">
                  "{replyResult.reply}"
                </div>
                <div className="flex justify-end mt-4">
                  <Btn v="ghost" sz="sm" icon="copy">Copy Draft</Btn>
                </div>
              </Card>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
