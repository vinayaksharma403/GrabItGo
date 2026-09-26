import React from 'react'

const Loading = ({ size = "md", message = "Loading..." }) => {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-[3px]",
    lg: "w-12 h-12 border-4",
  }

  return (
    <div className='flex flex-col items-center justify-center p-8 gap-3' role="status" aria-live="polite">
      <div className={`relative ${sizeClasses[size] || sizeClasses.md} rounded-full border-brand-100 border-t-brand-600 animate-spin`}>
      </div>
      {message && <span className="text-xs font-medium text-slate-500 tracking-wide">{message}</span>}
      <span className="sr-only">{message}</span>
    </div>
  )
}

export default Loading

