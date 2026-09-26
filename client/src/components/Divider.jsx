import React from 'react'

const Divider = ({ className = "my-2" }) => {
  return (
    <div className={`h-[1px] bg-slate-200 w-full ${className}`} role="separator" aria-hidden="true" />
  )
}

export default Divider

