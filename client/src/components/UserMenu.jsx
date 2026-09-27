import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import Divider from './Divider'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import { logout } from '../store/userSlice'
import { setAddressList } from '../store/addressSlice'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import {
  FiExternalLink,
  FiLogOut,
  FiPackage,
  FiMapPin,
  FiGrid,
  FiLayers,
  FiUploadCloud,
  FiBox,
  FiShoppingBag,
  FiUser
} from 'react-icons/fi'
import { FaUserCircle } from 'react-icons/fa'
import isAdmin from '../utils/isAdmin'

const UserMenu = ({ close }) => {
  const user = useSelector((state) => state.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      const response = await Axios({ ...SummaryApi.logout })

      if (response.data.success) {
        if (close) close()
        dispatch(logout())
        dispatch(setAddressList([]))
        localStorage.clear()
        toast.success(response.data.message)
        navigate('/')
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  const handleClose = () => {
    if (close) close()
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-control font-medium text-xs sm:text-sm transition-all duration-150 ${
      isActive
        ? 'bg-brand-50 text-brand-700 font-semibold shadow-subtle'
        : 'text-surface-title hover:bg-surface-50 hover:text-brand-600'
    }`

  const adminNavLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-control font-medium text-xs sm:text-sm transition-all duration-150 ${
      isActive
        ? 'bg-amber-50 text-amber-800 font-semibold shadow-subtle'
        : 'text-surface-title hover:bg-amber-50/60 hover:text-amber-900'
    }`

  return (
    <div className='w-full text-surface-title'>
      {/* Profile Header */}
      <div className='flex items-center gap-3 pb-4'>
        <div className='w-11 h-11 flex items-center justify-center bg-brand-50 text-brand-600 rounded-full shrink-0 overflow-hidden ring-2 ring-brand-500/20'>
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name || 'User avatar'}
              className='w-full h-full rounded-full object-cover'
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          ) : (
            <FaUserCircle size={32} />
          )}
        </div>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-1.5'>
            <h3 className='font-bold text-sm text-surface-title truncate'>
              {user.name || 'My Account'}
            </h3>
            {isAdmin(user.role) && (
              <span className='badge-accent text-[10px] px-1.5 py-0.5'>Admin</span>
            )}
          </div>
          <p className='text-xs text-surface-muted truncate'>
            {user.email || user.mobile || 'GrabItGo Customer'}
          </p>
        </div>
        <Link
          onClick={handleClose}
          to='/dashboard/profile'
          aria-label='View complete user profile'
          className='text-surface-muted hover:text-brand-600 hover:bg-brand-50 p-1.5 rounded-control transition-colors shrink-0'
        >
          <FiExternalLink size={15} />
        </Link>
      </div>

      <Divider />

      {/* Shopping Account Navigation Links */}
      <div className='py-3 space-y-1'>
        <div className='px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-surface-muted'>
          Shopping & Account
        </div>
        <NavLink onClick={handleClose} to='/dashboard/myorders' className={navLinkClass}>
          <FiPackage size={17} className='shrink-0' />
          <span>My Orders</span>
        </NavLink>
        <NavLink onClick={handleClose} to='/dashboard/address' className={navLinkClass}>
          <FiMapPin size={17} className='shrink-0' />
          <span>Saved Addresses</span>
        </NavLink>
        <NavLink onClick={handleClose} to='/dashboard/profile' className={navLinkClass}>
          <FiUser size={17} className='shrink-0' />
          <span>Profile Settings</span>
        </NavLink>
      </div>

      {/* Admin Management Section */}
      {isAdmin(user.role) && (
        <>
          <Divider />
          <div className='py-3 space-y-1'>
            <div className='px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-600'>
              Admin Panel
            </div>
            <NavLink onClick={handleClose} to='/dashboard/category' className={adminNavLinkClass}>
              <FiGrid size={17} className='shrink-0 text-amber-600' />
              <span>Category List</span>
            </NavLink>
            <NavLink onClick={handleClose} to='/dashboard/subcategory' className={adminNavLinkClass}>
              <FiLayers size={17} className='shrink-0 text-amber-600' />
              <span>Subcategories</span>
            </NavLink>
            <NavLink onClick={handleClose} to='/dashboard/upload-product' className={adminNavLinkClass}>
              <FiUploadCloud size={17} className='shrink-0 text-amber-600' />
              <span>Upload Product</span>
            </NavLink>
            <NavLink onClick={handleClose} to='/dashboard/product' className={adminNavLinkClass}>
              <FiBox size={17} className='shrink-0 text-amber-600' />
              <span>All Products</span>
            </NavLink>
            <NavLink onClick={handleClose} to='/dashboard/orders' className={adminNavLinkClass}>
              <FiShoppingBag size={17} className='shrink-0 text-amber-600' />
              <span>Customer Orders</span>
            </NavLink>
          </div>
        </>
      )}

      <Divider />

      {/* Logout Button */}
      <div className='pt-3'>
        <button
          type='button'
          onClick={handleLogout}
          className='w-full flex items-center gap-3 px-3 py-2.5 rounded-control text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer'
        >
          <FiLogOut size={17} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  )
}

export default UserMenu
