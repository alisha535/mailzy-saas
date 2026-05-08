import { useAuth } from '../../providers/AuthProvider'
import { Ic, ICONS, Badge } from '../ui'

export default function Topbar({ page, collapsed, setCollapsed, agRef }) {
  const { user, profile, signOut } = useAuth()

  return (
    <div ref={agRef} className="h-20 border-b border-black/5 flex items-center justify-between px-10 shrink-0 bg-white/40 backdrop-blur-3xl z-[40]">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-[#1D1D1F] p-2 hover:bg-black/5 rounded-xl transition-all" onClick={() => setCollapsed(!collapsed)}>
          <Ic d={ICONS.menu} s={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-[#0066CC] rounded-full opacity-20" />
          <h2 className="text-[#1D1D1F] font-black capitalize text-xl tracking-tight">{page.replace('-', ' ')}</h2>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 pr-6 border-r border-black/5">
          <div className="text-right hidden sm:block">
            <p className="text-[#1D1D1F] text-sm font-black tracking-tight leading-none mb-1">{profile?.name || user?.email?.split('@')[0]}</p>
            <div className="flex justify-end">
              <Badge color={profile?.plan === 'PRO' ? 'violet' : 'slate'} sz="xs" font="black">
                {profile?.plan || 'STARTER'}
              </Badge>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F5F5F7] to-[#E5E5E7] border border-black/5 flex items-center justify-center text-[#1D1D1F] font-black text-sm shadow-sm">
            {(profile?.name || user?.email)?.[0].toUpperCase()}
          </div>
        </div>

        <button 
          onClick={signOut} 
          className="flex items-center gap-2 text-[#86868B] hover:text-[#FF3B30] text-[13px] font-black transition-all duration-300 group"
        >
          <Ic d={ICONS.logout} s={16} c="group-hover:translate-x-0.5 transition-transform" />
          <span className="hidden md:inline uppercase tracking-widest text-[10px]">Sign Out</span>
        </button>
      </div>
    </div>
  )
}
