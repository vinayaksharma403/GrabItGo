import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import isAdmin from '../utils/isAdmin'
import { FiShieldOff, FiArrowLeft } from 'react-icons/fi'

const AdminPermission = ({ children }) => {
  const user = useSelector((state) => state.user)

  if (!isAdmin(user.role)) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-fadeIn'>
        <div className='w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 shadow-subtle'>
          <FiShieldOff size={32} />
        </div>
        <h2 className='text-xl font-bold text-slate-900 mb-2'>
          Administrator Access Required
        </h2>
        <p className='text-sm text-slate-500 max-w-md mb-6 leading-relaxed'>
          You do not have administrative privileges to view or manage this section. If you believe this is in error, please contact support.
        </p>
        <Link
          to='/'
          className='btn-primary inline-flex items-center gap-2 py-2 px-5 text-sm font-semibold'
        >
          <FiArrowLeft size={16} />
          <span>Return to Store</span>
        </Link>
      </div>
    )
  }

  return <>{children}</>
}

export default AdminPermission
