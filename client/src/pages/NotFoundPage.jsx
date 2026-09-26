import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiHome, FiArrowLeft, FiShoppingBag } from 'react-icons/fi'
import { IoSearch } from 'react-icons/io5'

const NotFoundPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = '404 - Page Not Found | GrabItGo'
  }, [])

  return (
    <div className='min-h-[75vh] flex items-center justify-center px-4 py-12 bg-surface-50 animate-fadeIn'>
      <div className='max-w-lg w-full text-center bg-white rounded-card p-6 sm:p-10 shadow-card border border-surface-border'>
        {/* Visual 404 Badge */}
        <div className='inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 mb-6 shadow-subtle'>
          <FiShoppingBag size={38} className='text-brand-600' />
        </div>

        <div className='inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100/70 text-emerald-800 mb-3'>
          404 • Page Not Found
        </div>

        <h1 className='text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3'>
          Looking for Something Fresh?
        </h1>

        <p className='text-sm sm:text-base text-slate-600 leading-relaxed mb-8 max-w-md mx-auto'>
          We couldn’t find the page or product you were looking for. It might have been moved, renamed, or is temporarily unavailable.
        </p>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row items-center justify-center gap-3'>
          <Link
            to='/'
            className='btn-primary w-full sm:w-auto text-sm font-semibold px-5 py-2.5 shadow-subtle inline-flex items-center justify-center gap-2'
          >
            <FiHome size={16} />
            <span>Go to Homepage</span>
          </Link>

          <Link
            to='/search'
            className='btn-secondary w-full sm:w-auto text-sm font-semibold px-5 py-2.5 inline-flex items-center justify-center gap-2'
          >
            <IoSearch size={16} />
            <span>Search Products</span>
          </Link>

          <button
            type='button'
            onClick={() => navigate(-1)}
            className='btn-outline w-full sm:w-auto text-sm font-semibold px-4 py-2.5 inline-flex items-center justify-center gap-1.5'
          >
            <FiArrowLeft size={15} />
            <span>Go Back</span>
          </button>
        </div>

        {/* Quick Suggestion Box */}
        <div className='mt-8 pt-6 border-t border-slate-100 text-xs text-slate-500'>
          <span>Need help finding everyday essentials? </span>
          <Link to='/#categories' className='text-brand-600 hover:text-brand-700 font-semibold underline underline-offset-2'>
            Explore All Categories
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
