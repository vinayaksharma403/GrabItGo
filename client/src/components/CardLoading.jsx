import React from 'react'

const CardLoading = () => {
  return (
    <div
      className='border border-surface-border rounded-card p-2.5 sm:p-3 shadow-subtle bg-white w-full min-w-[140px] sm:min-w-[160px] md:max-w-[200px] flex flex-col justify-between animate-pulse'
      aria-hidden='true'
    >
      <div>
        {/* Product Image Frame Placeholder */}
        <div className='h-28 sm:h-32 w-full bg-surface-100 rounded-xl mb-2 sm:mb-2.5'></div>

        {/* Tag Placeholder */}
        <div className='h-4 bg-surface-100 rounded-full w-14 mb-2'></div>

        {/* Title Placeholder */}
        <div className='h-3.5 bg-surface-100 rounded w-full mb-1.5'></div>
        <div className='h-3 bg-surface-100 rounded w-3/4 mb-2'></div>

        {/* Unit Placeholder */}
        <div className='h-3 bg-surface-100 rounded w-1/3 mb-3'></div>
      </div>

      {/* Price & Button Action Row Placeholder */}
      <div className='flex items-center justify-between mt-auto pt-2 border-t border-surface-border/50'>
        <div className='h-4 bg-surface-100 rounded w-12'></div>
        <div className='h-7 bg-surface-100 rounded-control w-14'></div>
      </div>
    </div>
  )
}

export default CardLoading
