import React from 'react'
import { IoClose } from 'react-icons/io5'
import { FiAlertTriangle } from 'react-icons/fi'

const ConfirmBox = ({
  cancel,
  confirm,
  close,
  title = 'Delete Confirmation',
  message = 'Are you sure you want to permanently delete this item? This action cannot be undone.'
}) => {
  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby='confirm-dialog-title'
      onKeyDown={(e) => {
        if (e.key === 'Escape') close?.()
      }}
      className='fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 animate-fadeIn'
      onClick={close}
    >
      <div
        className='bg-white w-full max-w-md p-6 rounded-2xl shadow-xl border border-slate-200/80 animate-fadeIn'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex justify-between items-start mb-4'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0'>
              <FiAlertTriangle size={20} />
            </div>
            <div>
              <h2 id='confirm-dialog-title' className='text-base font-bold text-slate-900'>
                {title}
              </h2>
              <p className='text-xs text-slate-500'>Irreversible action</p>
            </div>
          </div>
          <button
            type='button'
            onClick={close}
            aria-label='Close dialog'
            className='text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-100'
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Body */}
        <p className='text-sm text-slate-600 mb-6 leading-relaxed'>
          {message}
        </p>

        {/* Buttons */}
        <div className='flex justify-end gap-3 pt-2 border-t border-slate-100'>
          <button
            type='button'
            onClick={cancel}
            className='btn-secondary py-2 px-4 text-xs font-semibold'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={confirm}
            className='btn-danger py-2 px-4 text-xs font-semibold'
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmBox
