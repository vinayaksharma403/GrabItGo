import React from 'react'
import { IoClose } from 'react-icons/io5'

const ViewImage = ({ url, close }) => {
  if (!url) return null

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label='Image Preview'
      onKeyDown={(e) => {
        if (e.key === 'Escape') close?.()
      }}
      className='fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn'
      onClick={close}
    >
      {/* Close Button */}
      <button
        type='button'
        onClick={close}
        aria-label='Close image preview'
        className='absolute top-4 right-4 text-white/80 hover:text-white transition-colors cursor-pointer p-2 rounded-full bg-black/40 hover:bg-black/60 z-10'
      >
        <IoClose size={24} />
      </button>

      {/* Image Container */}
      <div
        className='max-w-4xl max-h-[85vh] p-2 flex items-center justify-center'
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={url}
          alt='Full view preview'
          className='max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10'
        />
      </div>
    </div>
  )
}

export default ViewImage
