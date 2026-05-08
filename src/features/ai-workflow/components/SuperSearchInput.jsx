import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function SuperSearchInput({ onSearch }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      // Simulate API call to the Edge Function or backend
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (onSearch) onSearch(query);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-[#86868B] group-focus-within:text-[#0066CC] transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="block w-full pl-12 pr-12 py-4 border border-black/5 rounded-2xl leading-5 bg-white placeholder-[#86868B] focus:outline-none focus:ring-4 focus:ring-[#0066CC]/10 focus:border-[#0066CC] text-[15px] text-[#1D1D1F] font-medium shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300"
          placeholder="e.g. Find SaaS founders in NYC who recently raised Series A..."
          disabled={isSearching}
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
          {isSearching && <Loader2 className="h-5 w-5 text-[#0066CC] animate-spin" />}
        </div>
      </form>
      <div className="mt-4 text-xs flex items-center gap-2">
        <span className="font-bold text-[#86868B]">Try:</span>
        <button className="text-[#0066CC] bg-[#0066CC]/5 px-3 py-1.5 rounded-full font-medium hover:bg-[#0066CC]/10 transition-colors" onClick={() => setQuery("Companies using React and Node.js")}>Companies using React</button>
        <button className="text-[#0066CC] bg-[#0066CC]/5 px-3 py-1.5 rounded-full font-medium hover:bg-[#0066CC]/10 transition-colors" onClick={() => setQuery("E-commerce brands with new product launches")}>E-commerce launches</button>
      </div>
    </div>
  );
}
