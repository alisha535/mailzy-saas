import { useEffect, useRef } from 'react'
import { useLeads } from './useLeads'
import Papa from 'papaparse'
import { Card, Btn, Ic, ICONS, StatusBadge, Spinner } from '../../components/ui'

export default function LeadsPage() {
  const { leads = [], loading, load, bulkImport, total = 0 } = useLeads()
  const fileInputRef = useRef(null)

  useEffect(() => {
    load()
  }, [load])

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.data && results.data.length > 0) {
          await bulkImport(results.data)
          // reset the file input
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error)
      }
    })
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F5F7]/30">
      {/* HEADER */}
      <div className="flex items-center justify-between px-8 py-10 bg-white/40 backdrop-blur-3xl border-b border-black/5 z-10">
        <div>
          <h1 className="text-3xl font-black text-[#1D1D1F] tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-black/5 flex items-center justify-center text-[#0066CC]">
              <Ic d={ICONS.users} s={24} />
            </div>
            Leads
          </h1>
          <p className="text-[#86868B] font-semibold mt-1 px-1">Manage {total} outbound prospects</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <Btn v="secondary" icon="refresh" sz="lg" onClick={() => fileInputRef.current?.click()} cls="bg-white/50 border-black/5">Import CSV</Btn>
          <Btn icon="plus" sz="lg" cls="shadow-blue-500/25">New Lead</Btn>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Search Bar */}
        <div className="relative group mb-10 max-w-2xl">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868B] group-focus-within:text-[#0066CC] transition-colors">
            <Ic d={ICONS.search} s={20} />
          </div>
          <input
            type="text"
            placeholder="Search leads by name, email or company..."
            className="w-full bg-white border border-black/10 rounded-2xl py-4 pl-12 pr-4 text-[15px] font-bold text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:ring-4 focus:ring-[#0066CC]/20"
            onChange={(e) => load({ search: e.target.value })}
          />
        </div>

        <Card cls="overflow-hidden border-black/5">
          <table className="w-full text-left">
            <thead className="bg-[#F5F5F7]/80 backdrop-blur-md border-b border-black/5">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-[#86868B] uppercase tracking-widest">Prospect</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#86868B] uppercase tracking-widest">Company</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#86868B] uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#86868B] uppercase tracking-widest">Added</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#86868B] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 bg-white/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <Spinner s={32} />
                    <p className="text-[#86868B] font-bold mt-4">Syncing leads database...</p>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-32 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 bg-[#F5F5F7] rounded-3xl flex items-center justify-center text-[#86868B] mb-6 mx-auto">
                        <Ic d={ICONS.users} s={32} />
                      </div>
                      <h3 className="text-[#1D1D1F] text-xl font-black mb-2">No leads found</h3>
                      <p className="text-[#86868B] font-medium mb-8">Ready to start outreach? Import your prospects via CSV.</p>
                      <Btn v="secondary" sz="lg" onClick={() => fileInputRef.current?.click()}>Upload CSV</Btn>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#F5F5F7]/40 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0066CC] to-[#004a99] text-white flex items-center justify-center font-black text-sm uppercase shadow-lg">
                          {lead.first_name?.[0] || lead.email?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-[#1D1D1F] text-base font-black tracking-tight">{lead.first_name} {lead.last_name}</p>
                          <p className="text-[#86868B] text-xs font-bold mt-0.5">{lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-[#1D1D1F] font-bold text-sm">{lead.company || '—'}</span>
                        {lead.job_title && <span className="text-[#86868B] text-xs font-medium mt-0.5">{lead.job_title}</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <StatusBadge status={lead.status || 'LEAD'} />
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[#86868B] font-black text-[10px] uppercase tracking-widest bg-black/5 px-2 py-1 rounded-md">
                        {new Date(lead.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Btn sz="sm" v="ghost" icon="edit" cls="p-2" />
                        <Btn sz="sm" v="ghost" icon="trash" cls="p-2 text-red-500 hover:bg-red-500/5 hover:text-red-600" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
