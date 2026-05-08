// ── Secure AI Copilot Panel — Routes through Edge Function ────
import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { Ic, ICONS, Btn, Spinner } from '../../../components/ui'

const QUICK_PROMPTS = [
  { icon: ICONS.bolt,    label: 'Optimize subject lines',     prompt: 'Give me 5 high-converting cold email subject lines for a B2B SaaS product.' },
  { icon: ICONS.mail,    label: 'Write a follow-up email',    prompt: 'Write a short follow-up email for a prospect who opened but never replied. Keep it under 60 words.' },
  { icon: ICONS.trending,label: 'Best send time',             prompt: 'What are the best days and times to send cold emails for maximum open rates? Give data-backed advice.' },
  { icon: ICONS.star,    label: 'Improve reply rate',         prompt: 'What are the top 5 things I can do right now to improve my cold email reply rate?' },
]

// Strip HTML/script tags from input (XSS protection)
const sanitize = (s) => String(s ?? '').replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').trim()

export default function CopilotPanel() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Hi! I\'m your Mailzy AI Copilot powered by LLaMA 3. I can help you write better emails, optimize campaigns, analyze results, and grow your reply rates. What do you need?' }
  ])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [hasKey,   setHasKey]   = useState(true)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text) => {
    const userText = sanitize(text || input).slice(0, 2000) // max 2000 chars
    if (!userText || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userText }])
    setLoading(true)

    try {
      // Build conversation history
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }))

      // Route through secure Edge Function (API key stays server-side)
      const { data, error } = await supabase.functions.invoke('groq-proxy', {
        body: {
          messages: [
            {
              role: 'system',
              content: `You are Mailzy Copilot — an expert cold email strategist and sales AI assistant. 
You help users write campaigns, improve deliverability, analyze results, and grow reply rates.
Be concise, practical, and actionable. Use bullet points when listing items. Keep responses under 200 words.`
            },
            ...history,
            { role: 'user', content: userText }
          ],
          max_tokens: 600,
        },
      })

      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)

      const reply = data?.content?.trim() || 'Sorry, no response generated.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      setHasKey(true)
    } catch (err) {
      const msg = err.message?.includes('No AI key') 
        ? '⚠️ No Groq API key found. Please go to **Settings → AI & Connectivity** and add your free Groq key.'
        : `❌ Error: ${err.message}`
      setMessages(prev => [...prev, { role: 'assistant', content: msg }])
      if (err.message?.includes('No AI key')) setHasKey(false)
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, loading, messages])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="w-80 bg-white border-l border-black/5 h-full flex flex-col fixed right-0 top-0 bottom-0 z-10 pt-16 shadow-[-4px_0_24px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="p-5 border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#AF52DE] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Ic d={ICONS.bolt} s={16} c="text-white" />
          </div>
          <div>
            <h2 className="text-[#1D1D1F] font-black text-sm">Mailzy Copilot</h2>
            <p className="text-[#86868B] text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#34C759] rounded-full animate-pulse" />
              LLaMA 3 · Powered by Groq
            </p>
          </div>
        </div>
      </div>

      {/* Quick prompts (only when chat is empty) */}
      {messages.length <= 1 && (
        <div className="p-4 border-b border-black/5">
          <p className="text-[#86868B] text-[10px] font-black uppercase tracking-widest mb-3">Quick Actions</p>
          <div className="space-y-2">
            {QUICK_PROMPTS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q.prompt)}
                disabled={loading}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#F5F5F7] transition-all group"
              >
                <div className="w-6 h-6 bg-[#AF52DE]/10 rounded-lg flex items-center justify-center shrink-0">
                  <Ic d={q.icon} s={12} c="text-[#AF52DE]" />
                </div>
                <span className="text-[#1D1D1F] text-xs font-bold group-hover:text-[#0066CC] transition-colors">{q.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-6 h-6 bg-[#AF52DE] rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <Ic d={ICONS.bolt} s={10} c="text-white" />
              </div>
            )}
            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs font-medium leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-[#0066CC] text-white rounded-br-sm'
                : 'bg-[#F5F5F7] text-[#1D1D1F] rounded-bl-sm border border-black/5'
            }`}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 bg-[#AF52DE] rounded-full flex items-center justify-center shrink-0 mr-2">
              <Ic d={ICONS.bolt} s={10} c="text-white" />
            </div>
            <div className="bg-[#F5F5F7] border border-black/5 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#86868B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-[#86868B] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-[#86868B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-black/5 bg-white/80 backdrop-blur-md">
        {!hasKey && (
          <p className="text-[10px] text-[#FF9500] font-bold mb-2 text-center">
            ⚠️ Add Groq key in Settings to enable AI
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Copilot anything..."
            rows={1}
            className="flex-1 resize-none bg-[#F5F5F7] border-2 border-transparent rounded-2xl px-3.5 py-2.5 text-[13px] font-medium text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#AF52DE]/30 focus:bg-white transition-all"
            style={{ maxHeight: '100px', overflowY: 'auto' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-[#AF52DE] hover:bg-[#9E3BB5] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:-translate-y-px active:scale-95 shrink-0"
          >
            {loading ? <Spinner s={14} c="text-white border-white/30 border-t-white" /> : <Ic d={ICONS.send} s={14} c="text-white" />}
          </button>
        </div>
      </div>
    </div>
  )
}
