import React, { useState } from 'react'
import { FaRegEyeSlash, FaRegEye } from 'react-icons/fa'
import { FiLock, FiMail, FiArrowRight } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { Link, useNavigate } from 'react-router-dom'
import fetchUserDetails from '../utils/fetchUserDetails'
import { useDispatch } from 'react-redux'
import { setUserDetails } from '../store/userSlice'

const Login = () => {
  const [data, setData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const validValue = Boolean(data.email.trim() && data.password.trim())

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validValue || loading) return

    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.login,
        data: data
      })

      if (response.data.error) {
        toast.error(response.data.message)
      }

      if (response.data.success) {
        toast.success(response.data.message)
        localStorage.removeItem('accesstoken')
        localStorage.setItem('accessToken', response.data.data.accessToken)
        localStorage.setItem('refreshToken', response.data.data.refreshToken)

        const userDetails = await fetchUserDetails()
        dispatch(setUserDetails(userDetails.data))

        setData({
          email: '',
          password: ''
        })
        navigate('/')
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
            Welcome back
          </h1>
          <p className='text-sm text-slate-500 mt-1'>
            Enter your credentials to access your GrabItGo account
          </p>
        </div>

        {/* Login Form */}
        <form className='space-y-4' onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <div>
            <label
              htmlFor='email'
              className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5'
            >
              Email Address
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                <FiMail size={16} />
              </div>
              <input
                type='email'
                id='email'
                name='email'
                autoComplete='email'
                autoFocus
                required
                value={data.email}
                onChange={handleChange}
                placeholder='name@example.com'
                className='input-field pl-10'
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className='flex items-center justify-between mb-1.5'>
              <label
                htmlFor='password'
                className='block text-xs font-semibold text-slate-700 uppercase tracking-wider'
              >
                Password
              </label>
              <Link
                to='/forgot-password'
                className='text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors'
              >
                Forgot password?
              </Link>
            </div>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                <FiLock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id='password'
                name='password'
                autoComplete='current-password'
                required
                value={data.password}
                onChange={handleChange}
                placeholder='Enter your password'
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
                Signing in...
              </span>
            ) : (
              <>
                <span>Sign In</span>
                <FiArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className='mt-6 pt-5 border-t border-slate-100 text-center'>
          <p className='text-sm text-slate-600'>
            Don&apos;t have an account?{' '}
            <Link
              to='/register'
              className='font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors'
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Login
