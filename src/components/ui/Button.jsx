import React from 'react'

export function Button({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2"
  
  const variants = {
    primary: "bg-[#0066CC] hover:bg-[#0055B3] text-white shadow-apple btn-3d focus:ring-[#0066CC]",
    secondary: "bg-white text-[#1D1D1F] border border-black/5 shadow-sm hover:shadow-apple-hover focus:ring-black/10",
    danger: "bg-[#FF3B30] hover:bg-[#E0352B] text-white shadow-apple btn-3d focus:ring-[#FF3B30]",
    ghost: "bg-transparent hover:bg-black/5 text-[#1D1D1F]"
  }

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} px-4 py-2 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
