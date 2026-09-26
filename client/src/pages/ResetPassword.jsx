import React, { useEffect, useState } from 'react'
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6'
import { FiLock, FiCheckCircle } from 'react-icons/fi'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/axios'

const ResetPassword = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
    resetToken: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!location?.state?.data?.success) {
      navigate('/')
      return
    }

    if (location?.state?.email) {
      setData((prev) => ({
        ...prev,
        email: location?.state?.email || '',
        resetToken: location?.state?.resetToken || ''
      }))
    }
  }, [location, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const validValue = Boolean(
    data.email && data.newPassword && data.confirmPassword
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validValue || loading) return

    if (data.newPassword !== data.confirmPassword) {
      toast.error('New password and Confirm password must match')
      return
    }

    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.resetPassword,
        data: data
      })

      if (response.data.error) {
        toast.error(response.data.message)
      }

      if (response.data.success) {
        toast.success(response.data.message)
        setData({
          email: '',
          newPassword: '',
          confirmPassword: '',
          resetToken: ''
        })
        navigate('/login')
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className='min-h-[80vh] flex items-center justify-center py-10 px-4 sm:px-6'>
      <div className='w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 sm:p-8 animate-fadeIn'>
        {/* Header Branding */}
        <div className='text-center mb-6'>
          <div className='inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 mb-3 shadow-subtle'>
            <FiLock size={22} />
          </div>
          <h1 className='text-2xl font-bold text-slate-900 tracking-tight'>
            Set New Password
          </h1>
          <p className='text-sm text-slate-500 mt-1.5 leading-relaxed'>
            Create a strong, new password for your account.
          </p>
        </div>

        {/* Reset Password Form */}
        <form className='space-y-4' onSubmit={handleSubmit} noValidate>
          {/* New Password */}
          <div>
            <label
              htmlFor='newPassword'
              className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5'
            >
              New Password
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                <FiLock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id='newPassword'
                name='newPassword'
                autoComplete='new-password'
                autoFocus
                required
                value={data.newPassword}
                onChange={handleChange}
                placeholder='Enter new password'
                className='input-field pl-10 pr-10'
              />
              <button
                type='button'
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className='absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer'
              >
                {showPassword ? <FaRegEye size={16} /> : <FaRegEyeSlash size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label
              htmlFor='confirmPassword'
              className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5'
            >
              Confirm New Password
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                <FiLock size={16} />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id='confirmPassword'
                name='confirmPassword'
                autoComplete='new-password'
                required
                value={data.confirmPassword}
                onChange={handleChange}
                placeholder='Confirm new password'
                className='input-field pl-10 pr-10'
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                className='absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer'
              >
                {showConfirmPassword ? <FaRegEye size={16} /> : <FaRegEyeSlash size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type='submit'
            disabled={!validValue || loading}
            className='btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-2 font-semibold text-sm tracking-wide'
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
                Updating Password...
              </span>
            ) : (
              <>
                <FiCheckCircle size={16} />
                <span>Change Password</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className='mt-6 pt-5 border-t border-slate-100 text-center'>
          <p className='text-sm text-slate-600'>
            Remembered your password?{' '}
            <Link
              to='/login'
              className='font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors'
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default ResetPassword
