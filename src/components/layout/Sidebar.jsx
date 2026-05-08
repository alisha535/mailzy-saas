import { Ic, ICONS } from '../ui';

export default function Sidebar({ page, onNav, collapsed, setCollapsed, agRef }) {
  const navItems = [
    { id: 'copilot',     icon: ICONS.bolt, label: 'AI Copilot' },
    { id: 'agents',      icon: ICONS.cpu, label: 'AI workforce' },
    { id: 'supersearch', icon: ICONS.search, label: 'SuperSearch' },
    { id: 'leads',       icon: ICONS.users, label: 'Prospects' },
    { id: 'campaigns',   icon: ICONS.send, label: 'Campaigns' },
    { id: 'unibox',      icon: ICONS.inbox, label: 'Unibox' },
    { id: 'analytics',   icon: ICONS.chart, label: 'Analytics' },
    { id: 'inboxes',     icon: ICONS.mail, label: 'Sender Accounts' },
    { id: 'settings',    icon: ICONS.settings, label: 'Platform' },
  ]

  return (
    <div ref={agRef} className={`bg-white/80 backdrop-blur-3xl border-r border-black/5 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-[50] ${collapsed ? 'w-20' : 'w-72'}`}>
      <div className="h-20 flex items-center px-6 shrink-0">
        <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#0066CC] to-[#004a99] shadow-xl shadow-blue-500/20 flex items-center justify-center text-white font-black shrink-0">
          <Ic d={ICONS.bolt} s={20} />
        </div>
        {!collapsed && (
          <div className="ml-3 flex flex-col">
            <span className="text-[#1D1D1F] font-black text-xl tracking-tighter leading-none">Mailzy</span>
            <span className="text-[#86868B] text-[10px] font-black uppercase tracking-widest mt-0.5">Enterprise</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
        {navItems.map(item => {
          const isActive = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              title={collapsed ? item.label : ''}
              className={`w-full flex items-center px-4 py-3 rounded-2xl text-[13px] font-black tracking-tight transition-all duration-300 group ${
                isActive 
                  ? 'bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] text-[#0066CC] border border-black/5' 
                  : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/5 border border-transparent'
              }`}
            >
              <div className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                <Ic d={item.icon} s={18} />
              </div>
              {!collapsed && <span className="ml-4 truncate">{item.label}</span>}
              {!collapsed && isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0066CC] shadow-[0_0_8px_rgba(0,102,204,0.5)]" />}
            </button>
          )
        })}
      </div>

      <div className="p-6 border-t border-black/5 bg-[#F5F5F7]/30">
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="w-full flex items-center justify-center p-3 rounded-xl bg-white border border-black/5 text-[#86868B] hover:text-[#1D1D1F] hover:shadow-md transition-all duration-300"
        >
          <Ic d={collapsed ? ICONS.arrowR : ICONS.arrowL} s={16} />
          {!collapsed && <span className="ml-3 text-xs font-black uppercase tracking-widest">Collapse</span>}
        </button>
      </div>
    </div>
  )
}
