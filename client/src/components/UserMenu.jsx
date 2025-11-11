import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import Divider from './Divider'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import { logout } from '../store/userSlice'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import { FiExternalLink, FiLogOut } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
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
        localStorage.clear()
        toast.success(response.data.message)
        navigate("/")
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  const handleClose = () => {
    if (close) close()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all duration-300 hover:shadow-md">
      
      {/* Profile Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 flex items-center justify-center bg-amber-100 text-amber-600 rounded-full">
          <FaUserCircle size={28} />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-gray-800 text-sm">My Account</h2>
          <div className="flex items-center text-xs text-gray-600 gap-2">
            <span className="truncate max-w-[120px]">
              {user.name || user.mobile}{" "}
              {user.role === 'ADMIN' && <span className="text-amber-600 font-medium">(Admin)</span>}
            </span>
            <Link
              onClick={handleClose}
              to="/dashboard/profile"
              className="hover:text-amber-500 transition-colors"
            >
              <FiExternalLink size={13} />
            </Link>
          </div>
        </div>
      </div>

      <Divider />

      {/* Menu List */}
      <nav className="mt-2 text-sm text-gray-700 grid gap-1">
        {isAdmin(user.role) && (
          <>
            <Link onClick={handleClose} to="/dashboard/category" className="px-3 py-2 rounded-md hover:bg-amber-100 font-medium transition-all">Category</Link>
            <Link onClick={handleClose} to="/dashboard/subcategory" className="px-3 py-2 rounded-md hover:bg-amber-100 font-medium transition-all">Sub Category</Link>
            <Link onClick={handleClose} to="/dashboard/upload-product" className="px-3 py-2 rounded-md hover:bg-amber-100 font-medium transition-all">Upload Product</Link>
          </>
        )}

        <Link onClick={handleClose} to="/dashboard/product" className="px-3 py-2 rounded-md hover:bg-amber-100 font-medium transition-all">Product</Link>
        <Link onClick={handleClose} to="/dashboard/myorders" className="px-3 py-2 rounded-md hover:bg-amber-100 font-medium transition-all">My Orders</Link>
        <Link onClick={handleClose} to="/dashboard/address" className="px-3 py-2 rounded-md hover:bg-amber-100 font-medium transition-all">Saved Address</Link>

        <button
          onClick={handleLogout}
          className="mt-2 flex items-center gap-2 text-red-600 px-3 py-2 rounded-md hover:bg-red-100 font-medium transition-all"
        >
          <FiLogOut size={16} /> Log Out
        </button>
      </nav>
    </div>
  )
}

export default UserMenu
