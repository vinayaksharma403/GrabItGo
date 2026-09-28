import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Logo from './Logo'
import Search from './Search'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FaUser, FaBars } from 'react-icons/fa'
import { IoClose } from 'react-icons/io5'
import { BsCart4 } from 'react-icons/bs'
import { useSelector } from 'react-redux'
import { GoTriangleDown, GoTriangleUp } from 'react-icons/go'
import UserMenu from './UserMenu'

const Header = () => {
  const location = useLocation()
  const isSearchPage = location.pathname === '/search'
  const navigate = useNavigate()
  const user = useSelector((state) => state?.user)
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const menuRef = useRef(null)
  const drawerRef = useRef(null)

  const redirectToLoginPage = () => {
    navigate('/login')
  }

  const handleCloseUserMenu = useCallback(() => {
    setOpenUserMenu(false)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setOpenDrawer(false)
  }, [])

  const handleMobileUser = () => {
    if (!user?._id) {
      navigate('/login')
      return
    }
    setOpenDrawer(true)
  }

  // Lock body scroll only when mobile drawer is open
  useEffect(() => {
    if (openDrawer) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [openDrawer])

  // Close dropdown or drawer on Escape key or outside click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (openUserMenu) handleCloseUserMenu()
        if (openDrawer) handleCloseDrawer()
      }
    }

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        handleCloseUserMenu()
      }
      if (openDrawer && drawerRef.current && !drawerRef.current.contains(e.target)) {
        handleCloseDrawer()
      }
    }

    if (openUserMenu || openDrawer) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openUserMenu, openDrawer, handleCloseUserMenu, handleCloseDrawer])

  // Automatically close drawer when route changes
  useEffect(() => {
    setOpenDrawer(false)
  }, [location.pathname])

  const cartCount = user?.shopping_cart?.length || 0

  return (
    <header className='sticky top-0 z-40 flex flex-col justify-center bg-white/95 backdrop-blur-md border-b border-surface-border shadow-subtle'>
      {/* Desktop & Mobile Main Navigation Bar */}
      <div className='w-full px-3 sm:px-6 max-w-7xl mx-auto flex items-center justify-between gap-3 h-16 lg:h-20'>
        {/* Left: Mobile Menu Toggle & Brand Logo */}
        <div className='flex items-center gap-2 sm:gap-3'>
          <button
            type='button'
            onClick={() => setOpenDrawer(true)}
            aria-label='Open Navigation Menu'
            aria-expanded={openDrawer}
            className='lg:hidden text-surface-title hover:text-brand-600 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-control hover:bg-surface-50 transition-colors cursor-pointer'
          >
            <FaBars size={20} />
          </button>

          <div className='hidden lg:block'>
            <Logo size='md' showTagline={false} />
          </div>
          <div className='lg:hidden'>
            <Logo size='sm' showTagline={false} />
          </div>
        </div>

        {/* Center: Fluid Desktop Search Bar */}
        <div className='hidden lg:block flex-1 max-w-xl mx-4 xl:mx-8'>
          {!isSearchPage && <Search />}
        </div>

        {/* Right: Actions */}
        <div className='flex items-center gap-2 sm:gap-4'>
          {/* Mobile Right Actions */}
          <div className='flex items-center gap-1 sm:gap-2 lg:hidden'>
            <button
              type='button'
              className='text-surface-title hover:text-brand-600 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-control hover:bg-surface-50 transition-colors cursor-pointer'
              onClick={handleMobileUser}
              aria-label='User Account Menu'
            >
              <FaUser size={18} />
            </button>

            <Link
              to='/cart'
              aria-label={`View Shopping Cart (${cartCount} items)`}
              className='text-surface-title hover:text-brand-600 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-control hover:bg-surface-50 transition-colors relative'
            >
              <BsCart4 size={24} />
              {cartCount > 0 && (
                <span className='absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-xs animate-fadeIn'>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Right Actions */}
          <div className='hidden lg:flex items-center gap-4'>
            {user?._id ? (
              <div className='relative' ref={menuRef}>
                <button
                  type='button'
                  onClick={() => setOpenUserMenu((prev) => !prev)}
                  aria-expanded={openUserMenu}
                  aria-haspopup='true'
                  aria-label='User Account Menu'
                  className='flex select-none items-center gap-2 cursor-pointer py-2 px-3.5 rounded-control bg-surface-50 hover:bg-surface-100/80 border border-surface-border text-surface-title font-semibold text-sm transition-all shadow-subtle focus:outline-none focus:ring-2 focus:ring-brand-500'
                >
                  <div className='w-6 h-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs overflow-hidden shrink-0'>
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt='avatar'
                        className='w-full h-full object-cover'
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <FaUser size={12} />
                    )}
                  </div>
                  <span className='max-w-[120px] truncate'>{user.name || 'Account'}</span>
                  {openUserMenu ? (
                    <GoTriangleUp size={16} className='text-surface-muted' />
                  ) : (
                    <GoTriangleDown size={16} className='text-surface-muted' />
                  )}
                </button>

                {openUserMenu && (
                  <div className='absolute right-0 top-12 z-50 animate-fadeIn'>
                    <div className='bg-white rounded-card p-4 min-w-64 shadow-modal border border-surface-border'>
                      <UserMenu close={handleCloseUserMenu} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type='button'
                onClick={redirectToLoginPage}
                className='text-sm font-semibold px-4 py-2 text-surface-title hover:text-brand-600 hover:bg-surface-50 rounded-control transition-colors cursor-pointer border border-transparent hover:border-surface-border'
              >
                Log In
              </button>
            )}

            {/* Desktop Cart CTA */}
            <Link
              to='/cart'
              aria-label={`View shopping cart (${cartCount} items)`}
              className='btn-primary flex items-center gap-2 px-4 py-2.5 text-sm font-semibold shadow-card transition-all active:scale-98 relative'
            >
              <BsCart4 size={19} />
              <span>My Cart</span>
              {cartCount > 0 && (
                <span className='bg-white text-brand-700 text-xs font-bold rounded-full px-2 py-0.5 ml-0.5 shadow-subtle animate-fadeIn'>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar Row */}
      {!isSearchPage && (
        <div className='w-full px-3 pb-2.5 lg:hidden'>
          <Search />
        </div>
      )}

      {/* Mobile Slide-over Drawer Navigation */}
      {openDrawer &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role='dialog'
            aria-modal='true'
            aria-label='Mobile Navigation Drawer'
            className='fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[100] lg:hidden flex transition-opacity animate-fadeIn'
            onClick={handleCloseDrawer}
          >
            <div
              ref={drawerRef}
              className='w-4/5 max-w-sm h-full bg-white shadow-modal flex flex-col justify-between overflow-y-auto animate-fadeIn border-r border-surface-border p-4'
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className='flex items-center justify-between pb-3 border-b border-surface-border'>
                <div onClick={handleCloseDrawer}>
                  <Logo size='sm' />
                </div>
                <button
                  type='button'
                  onClick={handleCloseDrawer}
                  aria-label='Close Navigation Menu'
                  className='p-2 rounded-full hover:bg-surface-50 text-surface-muted hover:text-surface-title transition-colors cursor-pointer'
                >
                  <IoClose size={24} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className='flex-1 py-4 overflow-y-auto'>
                {user?._id ? (
                  <UserMenu close={handleCloseDrawer} />
                ) : (
                  <div className='flex flex-col gap-4 text-center py-6'>
                    <div className='w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto'>
                      <FaUser size={28} />
                    </div>
                    <div>
                      <h3 className='font-bold text-base text-surface-title'>Welcome to GrabItGo</h3>
                      <p className='text-xs text-surface-muted mt-1'>
                        Sign in to manage orders, saved addresses, and enjoy faster checkout.
                      </p>
                    </div>
                    <button
                      type='button'
                      onClick={() => {
                        handleCloseDrawer()
                        redirectToLoginPage()
                      }}
                      className='btn-primary w-full py-2.5 text-sm font-semibold'
                    >
                      Log In / Sign Up
                    </button>
                  </div>
                )}
              </div>

              {/* Drawer Trust Badge Footer */}
              <div className='pt-3 border-t border-surface-border text-center text-xs text-surface-muted'>
                <p className='font-medium text-brand-700'>GrabItGo Quick Commerce</p>
                <p className='text-[11px] text-surface-muted mt-0.5'>Fast • Fresh • Secure</p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  )
}

export default Header
