import React, { useState } from 'react';
import { Save, Plus, X, Wand2 } from 'lucide-react';

export default function PromptEngineBuilder() {
  const [promptName, setPromptName] = useState('My First AI Opener');
  const [systemPrompt, setSystemPrompt] = useState('Write a casual, 50-word email opener mentioning the prospect\'s recent news and tech stack. Ensure it is highly personalized.');
  const [variables, setVariables] = useState(['industry', 'tech_stack', 'recent_news']);
  const [maxWords, setMaxWords] = useState(60);

  const availableVariables = ['industry', 'tech_stack', 'recent_news', 'company_size', 'location'];

  const handleSave = () => {
    // Save to Supabase ai_prompts table
    console.log("Saving prompt:", { promptName, systemPrompt, variables, maxWords });
    alert("Prompt saved successfully!");
  };

  const addVariable = (v) => {
    if (!variables.includes(v)) {
      setVariables([...variables, v]);
    }
  };

  const removeVariable = (v) => {
    setVariables(variables.filter(vari => vari !== v));
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-[#1D1D1F] flex items-center gap-3">
          <div className="p-2.5 bg-[#AF52DE]/10 rounded-xl">
            <Wand2 className="h-5 w-5 text-[#AF52DE]" />
          </div>
          AI Prompt Engine
        </h2>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-[#0066CC] hover:bg-[#005bb5] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-[0_4px_12px_rgba(0,102,204,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Save className="h-4 w-4" />
          Save Prompt
        </button>
      </div>

      <div className="space-y-8">
        {/* Prompt Name */}
        <div>
          <label className="block text-sm font-bold text-[#1D1D1F] mb-2">Prompt Name</label>
          <input
            type="text"
            value={promptName}
            onChange={(e) => setPromptName(e.target.value)}
            className="w-full p-3.5 border border-black/10 rounded-xl focus:ring-4 focus:ring-[#0066CC]/10 focus:border-[#0066CC] text-[#1D1D1F] font-medium transition-all outline-none"
          />
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-sm font-bold text-[#1D1D1F] mb-1">System Instructions</label>
          <p className="text-[13px] text-[#86868B] font-medium mb-3">Instruct the AI on how to write the personalization opener. Use {`{{variable}}`} syntax to include dynamic fields.</p>
          <textarea
            rows={4}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full p-4 border border-black/10 rounded-xl focus:ring-4 focus:ring-[#0066CC]/10 focus:border-[#0066CC] text-[#1D1D1F] font-mono text-sm transition-all outline-none leading-relaxed"
          />
        </div>

        {/* Variables & Constraints */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Allowed Variables */}
          <div className="bg-[#F5F5F7] p-5 rounded-2xl border border-black/5">
            <label className="block text-sm font-bold text-[#1D1D1F] mb-3">Required Variables</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {variables.map(v => (
                <span key={v} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#AF52DE]/10 text-[#AF52DE]">
                  {v}
                  <button type="button" onClick={() => removeVariable(v)} className="ml-1.5 text-[#AF52DE] hover:text-[#8E3DBA] transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="pt-3 border-t border-black/5">
              <p className="text-[13px] text-[#86868B] font-medium mb-3">Available Variables:</p>
              <div className="flex flex-wrap gap-2">
                {availableVariables.filter(v => !variables.includes(v)).map(v => (
                  <button 
                    key={v}
                    onClick={() => addVariable(v)}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-[13px] font-medium border border-black/10 hover:bg-black/5 text-[#1D1D1F] transition-colors bg-white shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1 text-[#86868B]" /> {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Constraints */}
          <div className="bg-[#F5F5F7] p-5 rounded-2xl border border-black/5">
            <label className="block text-sm font-bold text-[#1D1D1F] mb-3">Constraints</label>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[13px] text-[#86868B] font-medium">Maximum Words</label>
                <div className="text-right text-[13px] font-bold text-[#1D1D1F] bg-white px-2 py-1 rounded-md shadow-sm border border-black/5">{maxWords}</div>
              </div>
              <input 
                type="range" 
                min="10" 
                max="150" 
                value={maxWords} 
                onChange={(e) => setMaxWords(parseInt(e.target.value))}
                className="w-full accent-[#0066CC]"
              />
            </div>
            <div className="mt-6 p-4 bg-[#0066CC]/5 text-[#0066CC] rounded-xl text-[13px] border border-[#0066CC]/10 leading-relaxed shadow-inner">
              <strong className="font-bold">Security Note:</strong> The system automatically enforces a strict anti-hallucination policy. If required variables are missing for a lead, generation will safely fallback.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
