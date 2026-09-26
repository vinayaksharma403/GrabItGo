import React from 'react'
import { IoClose } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import UserMenu from '../components/UserMenu'

const UserMenuMobile = () => {
  const navigate = useNavigate()

  return (
    <div className='min-h-screen bg-surface-50 py-4 px-3 sm:px-6'>
      <div className='max-w-md mx-auto bg-white rounded-card shadow-card border border-surface-border p-4'>
        <div className='flex items-center justify-between pb-3 mb-2 border-b border-surface-border'>
          <h1 className='font-bold text-base text-surface-title'>Account Settings</h1>
          <button
            type='button'
            onClick={() => navigate('/')}
            aria-label='Close menu and return home'
            className='text-surface-muted hover:text-surface-title p-2 hover:bg-surface-50 rounded-full transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center'
          >
            <IoClose size={22} />
          </button>
        </div>
        <UserMenu close={() => navigate('/')} />
      </div>
    </div>
  )
}

export default UserMenuMobile
