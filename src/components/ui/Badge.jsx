import React from 'react'

export function Badge({ children, variant = 'gray', className = '' }) {
  const variants = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    yellow: "bg-yellow-50 text-yellow-700",
  }

  return (
    <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
