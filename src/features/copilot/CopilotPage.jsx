import React from 'react';
import CopilotPanel from '../ai-workflow/components/CopilotPanel';
import { Card, Ic, ICONS, Btn } from '../../components/ui';

export default function CopilotPage() {
  return (
    <div className="flex h-full w-full bg-[#F5F5F7]/30">
      <div className="flex-1 p-10 overflow-y-auto pr-[380px]">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 flex items-center gap-5">
            <div className="w-14 h-14 bg-[#AF52DE] text-white rounded-[20px] flex items-center justify-center shadow-xl shadow-purple-500/20">
              <Ic d={ICONS.bolt} s={28} />
            </div>
            <div>
              <h1 className="text-[#1D1D1F] text-4xl font-black tracking-tight">AI Copilot</h1>
              <p className="text-[#86868B] font-semibold mt-1">Autonomous campaign optimization & strategy engine</p>
            </div>
          </div>
          
          <Card cls="p-16 text-center shadow-xl shadow-black/5 bg-white">
            <div className="w-24 h-24 bg-[#F5F5F7] rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-black/5">
              <Ic d={ICONS.star} s={40} c="text-[#86868B]" />
            </div>
            <h2 className="text-[#1D1D1F] text-2xl font-black mb-4 tracking-tight">Deployment Pending</h2>
            <p className="text-[#86868B] text-base font-medium max-w-sm mx-auto leading-relaxed mb-10">
              Select an active campaign from the sidebar or Copilot panel to begin real-time optimization.
            </p>
            <Btn v="secondary" sz="lg" icon="grid">Browse Campaigns</Btn>
          </Card>
        </div>
      </div>
      
      <CopilotPanel />
    </div>
  )
}
