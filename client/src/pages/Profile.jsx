import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FaCircleUser } from 'react-icons/fa6'
import { FiUser, FiMail, FiPhone, FiCamera, FiCheckCircle, FiShield, FiSave } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import UserProfileAvatarEdit from '../components/UserProfileAvatarEdit'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import toast from 'react-hot-toast'
import { setUserDetails } from '../store/userSlice'
import fetchUserDetails from '../utils/fetchUserDetails'

const Profile = () => {
  const user = useSelector((state) => state.user)
  const [openProfileAvatarEdit, setProfileAvatarEdit] = useState(false)
  const [userData, setUserData] = useState({
    name: user.name || '',
    email: user.email || '',
    mobile: user.mobile || ''
  })

  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()

  useEffect(() => {
    setUserData({
      name: user.name || '',
      email: user.email || '',
      mobile: user.mobile || ''
    })
  }, [user])

  const handleOnChange = (e) => {
    const { name, value } = e.target
    setUserData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.updateUserDetails,
        data: userData
      })

      const { data: responseData } = response

      if (responseData.success) {
        toast.success(responseData.message)
        const updatedUser = await fetchUserDetails()
        dispatch(setUserDetails(updatedUser.data))
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='space-y-6 animate-fadeIn'>
      {/* Page Title */}
      <div>
        <h1 className='text-2xl font-bold text-surface-title tracking-tight'>
          Profile Settings
        </h1>
        <p className='text-sm text-surface-muted mt-1'>
          Manage your account information and contact preferences
        </p>
      </div>

      {/* Main Profile Card */}
      <div className='bg-white rounded-card border border-surface-border shadow-card p-6 sm:p-8'>
        {/* Avatar Section */}
        <div className='flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-surface-border'>
          <div className='relative group'>
            <div className='w-24 h-24 rounded-full overflow-hidden ring-4 ring-brand-500/10 shadow-md bg-surface-100 flex items-center justify-center'>
              {user.avatar ? (
                <img
                  alt={user.name ? `${user.name}'s profile avatar` : 'Profile avatar'}
                  src={user.avatar}
                  className='w-full h-full object-cover'
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              ) : (
                <FaCircleUser size={72} className='text-surface-muted/60' />
              )}
            </div>
            <button
              type='button'
              onClick={() => setProfileAvatarEdit(true)}
              aria-label='Edit profile avatar'
              className='absolute bottom-0 right-0 p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-md transition-transform hover:scale-105 cursor-pointer'
              title='Change avatar'
            >
              <FiCamera size={15} />
            </button>
          </div>

          <div className='text-center sm:text-left flex-1'>
            <div className='flex flex-wrap items-center justify-center sm:justify-start gap-2'>
              <h2 className='text-lg font-bold text-surface-title'>
                {user.name || 'GrabItGo User'}
              </h2>
              {user.verify_email ? (
                <span className='inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200/80'>
                  <FiCheckCircle size={12} />
                  Verified
                </span>
              ) : (
                <span className='inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200/80'>
                  Unverified
                </span>
              )}
            </div>
            <p className='text-sm text-surface-muted mt-0.5'>{user.email || 'No email attached'}</p>
            <button
              type='button'
              onClick={() => setProfileAvatarEdit(true)}
              className='mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-3 py-1.5 rounded-control transition-colors cursor-pointer border border-brand-200'
            >
              <FiCamera size={13} />
              <span>Change Photo</span>
            </button>
          </div>
        </div>

        {/* Profile Details Form */}
        <form className='pt-6 space-y-5' onSubmit={handleSubmit}>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
            {/* Full Name */}
            <div>
              <label
                htmlFor='name'
                className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'
              >
                Full Name
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-muted'>
                  <FiUser size={16} />
                </div>
                <input
                  type='text'
                  id='name'
                  name='name'
                  value={userData.name}
                  onChange={handleOnChange}
                  placeholder='Enter your full name'
                  className='input-field pl-10'
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor='email'
                className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'
              >
                Email Address
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-muted'>
                  <FiMail size={16} />
                </div>
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={userData.email}
                  onChange={handleOnChange}
                  placeholder='Enter your email address'
                  className='input-field pl-10'
                  required
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className='sm:col-span-2 max-w-md'>
              <label
                htmlFor='mobile'
                className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'
              >
                Mobile Number
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-muted'>
                  <FiPhone size={16} />
                </div>
                <input
                  type='tel'
                  id='mobile'
                  name='mobile'
                  value={userData.mobile}
                  onChange={handleOnChange}
                  placeholder='Enter your 10-digit mobile number'
                  className='input-field pl-10'
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className='pt-2 flex justify-start'>
            <button
              type='submit'
              disabled={loading}
              className='btn-primary px-6 py-2.5 flex items-center gap-2 font-semibold text-sm'
            >
              {loading ? (
                <span className='inline-flex items-center gap-2'>
                  <svg
                    className='animate-spin h-4 w-4 text-white'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                  Saving Changes...
                </span>
              ) : (
                <>
                  <FiSave size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password Card */}
      <div className='bg-white rounded-card border border-surface-border shadow-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='flex items-start gap-4'>
          <div className='p-3 bg-amber-50 text-amber-700 rounded-control shrink-0 border border-amber-200/80'>
            <FiShield size={22} />
          </div>
          <div>
            <h3 className='font-bold text-surface-title text-sm'>
              Account Security & Password
            </h3>
            <p className='text-xs text-surface-muted mt-0.5 leading-relaxed'>
              Need to update your account password? Use our secure OTP-verified password reset.
            </p>
          </div>
        </div>
        <Link
          to='/forgot-password'
          className='btn-secondary text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0'
        >
          Reset Password
        </Link>
      </div>

      {/* Avatar Edit Modal */}
      {openProfileAvatarEdit && (
        <UserProfileAvatarEdit close={() => setProfileAvatarEdit(false)} />
      )}
    </div>
  )
}

export default Profile
