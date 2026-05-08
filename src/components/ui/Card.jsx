import React from 'react'

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div 
      className={`bg-white rounded-2xl border border-black/5 p-6 transition-all duration-300 ${
        hover ? 'hover:shadow-apple-hover shadow-sm' : 'shadow-apple'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
