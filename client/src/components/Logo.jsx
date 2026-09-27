import React from 'react'
import { Link } from 'react-router-dom'

const Logo = ({ size = 'md', showTagline = false, className = '', link = true }) => {
  // Size presets
  const sizeConfig = {
    sm: {
      icon: 26,
      text: 'text-base',
      tagline: 'text-[8px]',
      gap: 'gap-1.5'
    },
    md: {
      icon: 32,
      text: 'text-xl sm:text-2xl',
      tagline: 'text-[9px]',
      gap: 'gap-2'
    },
    lg: {
      icon: 40,
      text: 'text-2xl sm:text-3xl',
      tagline: 'text-[10px]',
      gap: 'gap-2.5'
    }
  }

  const currentSize = sizeConfig[size] || sizeConfig.md

  const content = (
    <div className={`inline-flex items-center ${currentSize.gap} group select-none ${className}`}>
      {/* Dynamic Quick-Commerce Brandmark Icon */}
      <div
        className='relative flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-emerald-500 shadow-subtle group-hover:shadow-card group-hover:scale-105 transition-all duration-200'
        style={{
          width: `${currentSize.icon}px`,
          height: `${currentSize.icon}px`
        }}
      >
        <svg
          viewBox='0 0 32 32'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          className='w-3/5 h-3/5 text-amber-300 drop-shadow-xs'
        >
          {/* Stylized Lightning Bolt Emblem */}
          <path
            d='M18 3L6 17H15L14 29L26 15H17L18 3Z'
            fill='currentColor'
            stroke='#ffffff'
            strokeWidth='1.2'
            strokeLinejoin='round'
          />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className='flex flex-col leading-none'>
        <div className={`font-black tracking-tight ${currentSize.text} flex items-center`}>
          <span className='text-brand-700'>Grab</span>
          <span className='text-slate-900'>It</span>
          <span className='text-amber-500 font-extrabold'>Go</span>
        </div>
        {showTagline && (
          <span className={`${currentSize.tagline} font-bold text-brand-600 tracking-wider uppercase mt-0.5`}>
            10-Min Delivery
          </span>
        )}
      </div>
    </div>
  )

  if (link) {
    return (
      <Link to='/' aria-label='GrabItGo Home' className='focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg p-0.5 transition-transform'>
        {content}
      </Link>
    )
  }

  return content
}

export default Logo
