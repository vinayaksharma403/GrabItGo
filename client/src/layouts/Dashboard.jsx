import React, { useState, useEffect } from 'react'
import UserMenu from '../components/UserMenu'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { FiMenu, FiX, FiChevronRight } from 'react-icons/fi'

const Dashboard = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Format section title from pathname
  const pathSegment = location.pathname.split('/').pop() || 'profile'
  const sectionTitleMap = {
    profile: 'Profile Settings',
    myorders: 'My Orders',
    address: 'Saved Addresses',
    category: 'Category Management',
    subcategory: 'Subcategory Management',
    'upload-product': 'Upload Product',
    product: 'All Products',
    orders: 'Customer Orders'
  }
  const currentTitle = sectionTitleMap[pathSegment] || 'Dashboard'

  // Close menu on route transition
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Lock body scroll only when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return (
    <section className='bg-surface-50 min-h-[85vh] w-full flex flex-col lg:flex-row'>
      {/* Mobile Top Navigation Strip (< lg) */}
      <div className='lg:hidden bg-white/95 backdrop-blur-md border-b border-surface-border px-4 py-2.5 flex items-center justify-between sticky top-[112px] z-30 shadow-subtle'>
        <div className='flex items-center gap-1.5 text-xs text-surface-muted font-medium'>
          <Link to='/dashboard/profile' className='hover:text-brand-600 transition-colors'>
            Account
          </Link>
          <FiChevronRight size={12} className='text-surface-muted' />
          <span className='font-semibold text-surface-title truncate max-w-[160px]'>
            {currentTitle}
          </span>
        </div>
        <button
          type='button'
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className='flex items-center gap-1.5 text-xs font-semibold text-surface-title bg-surface-100 hover:bg-surface-200 px-3 py-1.5 rounded-control transition-colors cursor-pointer'
          aria-expanded={mobileMenuOpen}
          aria-label='Toggle Account Menu'
        >
          {mobileMenuOpen ? <FiX size={15} /> : <FiMenu size={15} />}
          <span>Menu</span>
        </button>
      </div>

      {/* Mobile Drawer Navigation Modal */}
      {mobileMenuOpen && (
        <div
          className='lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex animate-fadeIn'
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className='w-4/5 max-w-xs bg-white h-full p-4 overflow-y-auto shadow-modal animate-fadeIn'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex justify-between items-center mb-3 pb-2 border-b border-surface-border'>
              <span className='font-bold text-surface-title text-sm'>Account Navigation</span>
              <button
                type='button'
                onClick={() => setMobileMenuOpen(false)}
                className='text-surface-muted hover:text-surface-title p-1.5 rounded-control hover:bg-surface-50 transition-colors cursor-pointer'
                aria-label='Close Account Menu'
              >
                <FiX size={18} />
              </button>
            </div>
            <UserMenu close={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar (>= lg) */}
      <aside className='hidden lg:block w-72 bg-white border-r border-surface-border p-5 shrink-0 min-h-[calc(100vh-80px)]'>
        <div className='sticky top-24'>
          <UserMenu />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className='flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 max-w-5xl'>
        <Outlet />
      </main>
    </section>
  )
}

export default Dashboard
