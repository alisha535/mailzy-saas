import { Card, Ic, ICONS, Badge, Spinner } from '../../components/ui';
import { useAnalytics } from './useAnalytics';

const PIPELINE_COLORS = {
  LEAD: 'bg-[#0066CC]',
  INTERESTED: 'bg-[#34C759]',
  MEETING_BOOKED: 'bg-[#5856D6]',
  MEETING_COMPLETED: 'bg-[#FF9500]',
  WON: 'bg-[#FFCC00]',
  LOST: 'bg-[#FF3B30]',
};

const COLOR_MAP = {
  blue: 'bg-[#0066CC]/10 text-[#0066CC]',
  emerald: 'bg-[#34C759]/10 text-[#34C759]',
  violet: 'bg-[#5856D6]/10 text-[#5856D6]',
  amber: 'bg-[#FF9500]/10 text-[#FF9500]',
};

function StatCard({ label, value, sub, color, icon }) {
  const ICONS_MAP = {
    '📧': 'mail',
    '👁': 'eye',
    '💬': 'refresh',
    '🎯': 'trending'
  };

  return (
    <Card hover cls="p-8 shadow-sm group">
      <div className="flex items-start justify-between mb-8">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-lg transition-transform group-hover:scale-110 ${COLOR_MAP[color]}`}>
          <Ic d={ICONS[ICONS_MAP[icon]]} s={24} />
        </div>
        <div className="flex flex-col items-end">
          <Badge color="emerald" sz="xs" dot cls="font-black">{sub}</Badge>
          <p className="text-[10px] text-[#86868B] font-black uppercase tracking-widest mt-1">Vs Last Month</p>
        </div>
      </div>
      <div>
        <p className="text-[#1D1D1F] text-4xl font-black mb-1 tracking-tight">{value}</p>
        <p className="text-[#86868B] text-sm font-bold uppercase tracking-wider">{label}</p>
      </div>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { loading, data, campaigns, leads } = useAnalytics();

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const maxBar = Math.max(...data.monthly, 1);

  const STATS = [
    { label: 'Total Sent', value: data.totalSent.toLocaleString(), sub: '+12%', color: 'blue', icon: '📧' },
    { label: 'Open Rate', value: data.openRate + '%', sub: '+4.2%', color: 'emerald', icon: '👁' },
    { label: 'Reply Rate', value: data.replyRate + '%', sub: '+1.1%', color: 'violet', icon: '💬' },
    { label: 'Opportunities', value: data.opportunities, sub: `${leads.filter(l => l.status === 'WON').length} won`, color: 'amber', icon: '🎯' },
  ];

  const pipelineStatuses = ['LEAD', 'INTERESTED', 'MEETING_BOOKED', 'MEETING_COMPLETED', 'WON', 'LOST'];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full bg-[#F5F5F7]/30">
      <Spinner s={48} />
      <p className="text-[#86868B] font-bold mt-6">Generating reports...</p>
    </div>
  );

  return (
    <div className="p-10 h-full overflow-y-auto bg-[#F5F5F7]/30">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-[#1D1D1F] text-3xl font-black tracking-tight">Performance Analytics</h1>
            <p className="text-[#86868B] font-semibold mt-1">Insights and trends across your email outreach</p>
          </div>
          <div className="flex gap-3 bg-white p-1.5 rounded-2xl border border-black/5 shadow-sm">
            {['7D', '30D', '90D', 'ALL'].map(t => (
              <button key={t} className={`px-4 py-2 rounded-xl text-[11px] font-black tracking-widest ${t === '30D' ? 'bg-[#0066CC] text-white shadow-lg shadow-blue-500/20' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          {STATS.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Monthly Bar Chart */}
        <Card cls="p-10 mb-10 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0066CC] to-[#5856D6]" />
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-[#1D1D1F] text-xl font-black tracking-tight">Outreach Volume</h3>
              <p className="text-[#86868B] text-sm font-semibold">Sent emails over the last 12 months</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#0066CC]" />
                <span className="text-[#86868B] text-xs font-bold uppercase tracking-widest">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-black/5" />
                <span className="text-[#86868B] text-xs font-bold uppercase tracking-widest">Historical</span>
              </div>
            </div>
          </div>
          <div className="flex items-end gap-3 h-64 px-4">
            {data.monthly.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4">
                <div
                  className="w-full rounded-[10px] transition-all duration-500 hover:scale-[1.02] cursor-pointer group relative shadow-sm"
                  style={{
                    height: `${(v / maxBar) * 100}%`,
                    background: i === new Date().getMonth() ? 'linear-gradient(180deg, #0066CC 0%, #0055B3 100%)' : '#F5F5F7',
                    minHeight: '8px',
                  }}
                >
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1D1D1F] text-white font-black text-xs px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap z-20 shadow-xl">
                    {v.toLocaleString()} Emails
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#1D1D1F]" />
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${i === new Date().getMonth() ? 'text-[#0066CC]' : 'text-[#86868B]'}`}>
                  {MONTHS[i]}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* System Health Monitor */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <Card cls="p-6 border-l-4 border-l-[#0066CC] shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Ic d={ICONS.clock} s={20} />
              </div>
              <div>
                <p className="text-[#86868B] text-[10px] font-black uppercase tracking-widest">Queue Pending</p>
                <p className="text-[#1D1D1F] text-xl font-black">{data.queueHealth?.pending || 0}</p>
              </div>
            </div>
          </Card>
          <Card cls="p-6 border-l-4 border-l-[#FF3B30] shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                <Ic d={ICONS.alert} s={20} />
              </div>
              <div>
                <p className="text-[#86868B] text-[10px] font-black uppercase tracking-widest">Queue Failed</p>
                <p className="text-[#1D1D1F] text-xl font-black">{data.queueHealth?.failed || 0}</p>
              </div>
            </div>
          </Card>
          <Card cls="p-6 border-l-4 border-l-[#34C759] shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                <Ic d={ICONS.check} s={20} />
              </div>
              <div>
                <p className="text-[#86868B] text-[10px] font-black uppercase tracking-widest">Sent Today</p>
                <p className="text-[#1D1D1F] text-xl font-black">{data.queueHealth?.sent || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Pipeline + Campaign Performance */}
        <div className="grid grid-cols-2 gap-10">
          <Card cls="p-10 shadow-sm">
            <h3 className="text-[#1D1D1F] text-xl font-black mb-10 tracking-tight flex items-center gap-3">
              <Ic d={ICONS.users} s={24} c="text-[#0066CC]" />
              Lead Pipeline
            </h3>
            <div className="space-y-8">
              {pipelineStatuses.map(s => {
                const count = leads.filter(l => l.status === s).length;
                const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
                return (
                  <div key={s} className="group">
                    <div className="flex justify-between mb-3 items-end">
                      <span className="text-[#86868B] text-[11px] font-black uppercase tracking-widest group-hover:text-[#1D1D1F] transition-colors">{s.replace(/_/g, ' ')}</span>
                      <span className="text-[#1D1D1F] text-lg font-black">{count}</span>
                    </div>
                    <div className="h-2.5 bg-[#F5F5F7] rounded-full overflow-hidden relative">
                      <div className={`absolute top-0 left-0 h-full ${PIPELINE_COLORS[s]} rounded-full transition-all duration-1000 ease-out shadow-lg`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card cls="p-10 shadow-sm">
            <h3 className="text-[#1D1D1F] text-xl font-black mb-10 tracking-tight flex items-center gap-3">
              <Ic d={ICONS.trending} s={24} c="text-[#AF52DE]" />
              Campaign Yield
            </h3>
            {campaigns.filter(c => c.sent > 0).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center p-10 bg-black/[0.01] border-2 border-dashed border-black/5 rounded-[32px]">
                <div className="w-16 h-16 bg-white rounded-[22px] shadow-sm flex items-center justify-center mb-6 text-[#86868B]">
                  <Ic d={ICONS.chart} s={32} />
                </div>
                <p className="text-[#1D1D1F] font-black text-lg">Awaiting Campaign Data</p>
                <p className="text-[#86868B] text-sm font-medium">Launch your first campaign to see conversion metrics here.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {campaigns.filter(c => c.sent > 0).map(c => (
                  <div key={c.id} className="group">
                    <div className="flex justify-between mb-3 items-end">
                      <span className="text-[#1D1D1F] text-sm font-black truncate max-w-[70%] tracking-tight">{c.name}</span>
                      <span className="text-[#0066CC] text-sm font-black bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        {c.sent > 0 ? ((c.replied / c.sent) * 100).toFixed(1) : 0}% Engagement
                      </span>
                    </div>
                    <div className="h-2.5 bg-[#F5F5F7] rounded-full overflow-hidden relative">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#0066CC] to-[#AF52DE] rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <div className="flex gap-4 mt-3">
                      <p className="text-[10px] text-[#86868B] font-black uppercase tracking-widest">{c.sent} Sent</p>
                      <p className="text-[10px] text-[#86868B] font-black uppercase tracking-widest">{c.replied} Replies</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
