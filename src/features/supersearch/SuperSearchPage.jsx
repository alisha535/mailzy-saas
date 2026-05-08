import React from 'react';
import SuperSearchInput from '../ai-workflow/components/SuperSearchInput';
import PromptEngineBuilder from '../ai-workflow/components/PromptEngineBuilder';
import { Card, Ic, ICONS } from '../../components/ui';

export default function SuperSearchPage() {
  const handleSearch = (query) => {
    console.log("Searching for:", query);
  };

  return (
    <div className="p-10 h-full overflow-y-auto bg-[#F5F5F7]/30">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-[#1D1D1F] text-3xl font-black tracking-tight">SuperSearch</h1>
          <p className="text-[#86868B] font-semibold mt-1">Discover hyper-targeted leads using AI triggers & intent signals.</p>
        </div>
        
        <div className="mb-12">
          <SuperSearchInput onSearch={handleSearch} />
        </div>

        <div className="grid grid-cols-1 gap-12">
          <section>
            <div className="mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0066CC] text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Ic d={ICONS.bolt} s={20} />
              </div>
              <div>
                <h2 className="text-[#1D1D1F] text-xl font-black tracking-tight">Prompt Engine</h2>
                <p className="text-[#86868B] text-xs font-bold uppercase tracking-widest mt-0.5">Autonomous sequence architecture</p>
              </div>
            </div>
            <Card cls="p-8 shadow-sm">
              <p className="text-[#86868B] mb-8 text-sm font-medium leading-relaxed border-b border-black/5 pb-6">
                Design constrained AI prompts for automated sequence generation based on verified lead data and company research.
              </p>
              <PromptEngineBuilder />
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}
