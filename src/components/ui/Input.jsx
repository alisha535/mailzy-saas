import React from 'react'

export function Input({ className = '', ...props }) {
  return (
    <input 
      className={`w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-[#1D1D1F] placeholder-[#86868B] shadow-sm transition-all duration-300 focus:outline-none focus:border-[#0066CC] focus:ring-4 focus:ring-[#0066CC]/10 ${className}`}
      {...props}
    />
  )
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea 
      className={`w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-[#1D1D1F] placeholder-[#86868B] shadow-sm transition-all duration-300 focus:outline-none focus:border-[#0066CC] focus:ring-4 focus:ring-[#0066CC]/10 ${className}`}
      {...props}
    />
  )
}
