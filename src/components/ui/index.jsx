// ── COMPLETE UI COMPONENT LIBRARY ───────────────────────────

export const ICONS = {
  bolt:"M13 2L3 14h9l-1 8 10-12h-9l1-8z", star:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  grid:"M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z", search:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  mail:"M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  send:"M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z", inbox:"M22 13V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12c0 1.1.9 2 2 2h9M22 13l-5 5M22 18l-5-5",
  chart:"M18 20V10M12 20V4M6 20v-6", users:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  settings:"M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z",
  logout:"M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  plus:"M12 5v14M5 12h14", x:"M18 6L6 18M6 6l12 12", check:"M20 6L9 17l-5-5",
  eye:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  eyeoff:"M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22",
  arrowL:"M19 12H5M12 19l-7-7 7-7", arrowR:"M5 12h14M12 5l7 7-7 7",
  trash:"M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2",
  edit:"M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  play:"M5 3l14 9-14 9V3z", pause:"M6 4h4v16H6zM14 4h4v16h-4z",
  clock:"M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
  refresh:"M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  alert:"M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  chevD:"M6 9l6 6 6-6", chevU:"M18 15l-6-6-6 6",
  trending:"M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  cpu:"M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  shield:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  menu:"M3 12h18M3 6h18M3 18h18", copy:"M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2M8 4a2 2 0 012-2h4a2 2 0 012 2M8 4h8",
  link:"M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  zap:"M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  globe:"M12 2a10 10 0 100 20A10 10 0 0012 2zM2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20",
  filter:"M22 3H2l8 9.46V19l4 2v-8.54L22 3",
  spam:"M12 9v4M12 17h.01M5.07 19H19a2 2 0 001.75-2.96l-7-12a2 2 0 00-3.5 0l-7 12A2 2 0 005.07 19z",
}

export const Ic = ({ d, s=18, c='' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={c}>
    <path d={d} />
  </svg>
)

export const Btn = ({ children, onClick, v='primary', sz='md', disabled, cls='', icon }) => {
  const base = 'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-200 select-none disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none'
  const sizes = { xs:'px-2.5 py-1.5 text-[11px]', sm:'px-3.5 py-2 text-xs', md:'px-5 py-2.5 text-sm', lg:'px-7 py-3.5 text-sm' }
  const variants = {
    primary:   'bg-[#0066CC] hover:bg-[#005bb5] text-white shadow-[0_4px_12px_rgba(0,102,204,0.15)] hover:shadow-[0_6px_16px_rgba(0,102,204,0.25)] hover:-translate-y-px active:scale-[0.98]',
    secondary: 'bg-white border border-black/10 text-[#1D1D1F] hover:bg-[#F5F5F7] hover:border-black/20 hover:-translate-y-px active:scale-[0.98]',
    ghost:     'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/5',
    danger:    'bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/20',
    success:   'bg-[#34C759] hover:bg-[#2EB04E] text-white shadow-[0_4px_12px_rgba(52,199,89,0.15)] hover:shadow-[0_6px_16px_rgba(52,199,89,0.25)] hover:-translate-y-px active:scale-[0.98]',
    violet:    'bg-[#AF52DE] hover:bg-[#9E3BB5] text-white shadow-[0_4px_12px_rgba(175,82,222,0.15)] hover:shadow-[0_6px_16px_rgba(175,82,222,0.25)] hover:-translate-y-px active:scale-[0.98]',
    amber:     'bg-[#FF9500] hover:bg-[#E68600] text-white shadow-[0_4px_12px_rgba(255,149,0,0.15)] hover:shadow-[0_6px_16px_rgba(255,149,0,0.25)] hover:-translate-y-px active:scale-[0.98]',
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[sz]} ${variants[v]} ${cls}`}>
      {icon && <Ic d={ICONS[icon]||icon} s={13} />}{children}
    </button>
  )
}

export const Card = ({ children, cls='', onClick, hover }) => (
  <div onClick={onClick} className={`bg-white border border-black/5 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all duration-300 ${hover?'hover:border-black/15 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 cursor-pointer':''} ${cls}`}>{children}</div>
)

export const Inp = ({ label, value, onChange, placeholder, type='text', hint, err, cls='', rows, disabled }) => (
  <div className={cls}>
    {label && <label className="block text-[#1D1D1F] text-[13px] font-bold mb-2 ml-1">{label}</label>}
    {rows ? (
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} disabled={disabled}
        className={`w-full bg-[#F5F5F7] border-2 rounded-2xl px-4 py-3 text-[#1D1D1F] font-medium placeholder-[#86868B] text-sm focus:outline-none transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed ${err?'border-[#FF3B30]/40':'border-transparent focus:border-[#0066CC]/30 focus:bg-white focus:shadow-inner'}`} />
    ) : (
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className={`w-full bg-[#F5F5F7] border-2 rounded-2xl px-4 py-3 text-[#1D1D1F] font-medium placeholder-[#86868B] text-sm focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${err?'border-[#FF3B30]/40':'border-transparent focus:border-[#0066CC]/30 focus:bg-white focus:shadow-inner'}`} />
    )}
    {hint&&!err&&<p className="text-[#86868B] text-xs mt-1.5 ml-1 font-medium">{hint}</p>}
    {err&&<p className="text-[#FF3B30] text-xs mt-1.5 ml-1 font-medium">{err}</p>}
  </div>
)

export const Sel = ({ label, value, onChange, options, cls='' }) => (
  <div className={cls}>
    {label&&<label className="block text-[#1D1D1F] text-[13px] font-bold mb-2 ml-1">{label}</label>}
    <div className="relative">
      <select value={value} onChange={e=>onChange(e.target.value)} className="w-full bg-[#F5F5F7] border-2 border-transparent rounded-2xl px-4 py-3 text-[#1D1D1F] text-sm font-medium focus:outline-none focus:border-[#0066CC]/30 focus:bg-white transition-all cursor-pointer appearance-none">
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#86868B]">
        <Ic d={ICONS.chevD} s={14} />
      </div>
    </div>
  </div>
)

export const Badge = ({ color='slate', children, dot }) => {
  const c = { 
    blue:    'bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/10', 
    emerald: 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/10', 
    amber:   'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/10', 
    red:     'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/10', 
    violet:  'bg-[#AF52DE]/10 text-[#AF52DE] border-[#AF52DE]/10', 
    slate:   'bg-black/5 text-[#86868B] border-black/5' 
  }
  return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${c[color]}`}>{dot&&<span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_4px_currentColor]"/>}{children}</span>
}

export const StatusBadge = ({ status }) => {
  const m = { ACTIVE:['emerald','Active'], PAUSED:['amber','Paused'], DRAFT:['slate','Draft'], LEAD:['blue','Lead'], INTERESTED:['emerald','Interested'], MEETING_BOOKED:['violet','Meeting Booked'], MEETING_COMPLETED:['amber','Meeting Done'], WON:['emerald','⭐ Won'], LOST:['red','Lost'] }
  const [c,l] = m[status]||['slate','Unknown']
  return <Badge color={c} dot>{l}</Badge>
}

export const Modal = ({ open, onClose, title, children, w='max-w-xl' }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-xl transition-all animate-fade-in" onClick={onClose}/>
      <div className={`relative w-full ${w} bg-white border border-black/5 rounded-[32px] shadow-[0_24px_64px_rgba(0,0,0,0.08)] max-h-[90vh] overflow-hidden flex flex-col animate-scale-in`}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-black/5 bg-white/80 backdrop-blur-md">
          <h3 className="text-[#1D1D1F] text-xl font-black tracking-tight">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/10 transition-all"><Ic d={ICONS.x} s={16}/></button>
        </div>
        <div className="p-8 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export const ToastBar = ({ toasts }) => (
  <div className="fixed bottom-24 right-8 z-[9999] flex flex-col gap-3 pointer-events-none">
    {toasts.map(t=>(
      <div key={t.id} className={`flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-[0_12px_32px_rgba(0,0,0,0.1)] text-sm font-bold backdrop-blur-xl animate-slide-up
        ${t.type==='success'?'bg-emerald-50/95 border-emerald-500/20 text-[#2EB04E]':t.type==='error'?'bg-red-50/95 border-red-500/20 text-[#FF3B30]':'bg-white/95 border-black/5 text-[#1D1D1F]'}`}>
        <div className={`w-6 h-6 flex items-center justify-center rounded-full ${t.type==='success'?'bg-[#34C759]/10':t.type==='error'?'bg-[#FF3B30]/10':'bg-black/5'}`}>
          <Ic d={t.type==='success'?ICONS.check:t.type==='error'?ICONS.alert:ICONS.bolt} s={12}/>
        </div>
        {t.msg}
      </div>
    ))}
  </div>
)

export const Toggle = ({ on, onChange }) => (
  <button onClick={()=>onChange(!on)} className={`w-12 h-7 rounded-full relative transition-all duration-300 ${on?'bg-[#34C759] shadow-[0_2px_8px_rgba(52,199,89,0.3)]':'bg-black/10'}`}>
    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${on?'translate-x-6':'translate-x-1'}`}/>
  </button>
)

export const Spinner = ({ s=20, c='' }) => (
  <span style={{width:s,height:s}} className={`border-[3px] border-[#0066CC]/20 border-t-[#0066CC] rounded-full animate-spin inline-block ${c}`}/>
)
