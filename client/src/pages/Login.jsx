import React, { useState, useRef } from 'react'
import { FaRegEyeSlash, FaRegEye } from 'react-icons/fa'
import { FiLock, FiMail, FiArrowRight } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import fetchUserDetails from '../utils/fetchUserDetails'
import { useDispatch } from 'react-redux'
import { setUserDetails } from '../store/userSlice'
import { useGlobalContext } from '../provider/GlobalContext'
import Logo from '../components/Logo'

const Login = () => {
  const [data, setData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const isSubmittingRef = useRef(false)

  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { fetchCart, fetchAddress } = useGlobalContext() || {}

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
    if (!validValue || loading || isSubmittingRef.current) return

    try {
      isSubmittingRef.current = true
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
        if (userDetails?.data) {
          dispatch(setUserDetails(userDetails.data))
        }

        if (fetchCart) await fetchCart()
        if (fetchAddress) await fetchAddress()

        setData({
          email: '',
          password: ''
        })
        const destination = location.state?.from || '/'
        navigate(destination, { replace: true })
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
      isSubmittingRef.current = false
    }
  }

  return (
    <section className='min-h-[82vh] bg-surface-50 flex items-center justify-center py-10 px-4 sm:px-6'>
      <div className='w-full max-w-md bg-white rounded-card border border-surface-border shadow-card p-6 sm:p-8 animate-fadeIn'>
        {/* Header Branding */}
        <div className='text-center mb-6'>
          <div className='mb-4 flex justify-center'>
            <Logo size='sm' showTagline={false} />
          </div>
          <h1 className='text-xl sm:text-2xl font-bold text-surface-title tracking-tight'>
            Welcome Back
          </h1>
          <p className='text-xs sm:text-sm text-surface-muted mt-1'>
            Sign in to access your orders, cart, and fast checkout
          </p>
        </div>

        {/* Login Form */}
        <form className='space-y-4' onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
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
                autoComplete='email'
                autoFocus
                required
                disabled={loading}
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
                className='block text-xs font-semibold text-surface-title uppercase tracking-wider'
              >
                Password
              </label>
              <Link
                to='/forgot-password'
                className='text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors'
              >
                Forgot password?
              </Link>
            </div>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-muted'>
                <FiLock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id='password'
                name='password'
                autoComplete='current-password'
                required
                disabled={loading}
                value={data.password}
                onChange={handleChange}
                placeholder='Enter your password'
                className='input-field pl-10 pr-10'
              />
              <button
                type='button'
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className='absolute inset-y-0 right-0 pr-3.5 flex items-center text-surface-muted hover:text-surface-title transition-colors cursor-pointer min-w-[36px] min-h-[36px] justify-center'
              >
                {showPassword ? <FaRegEye size={16} /> : <FaRegEyeSlash size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type='submit'
            disabled={!validValue || loading}
            className='btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-2 font-semibold text-sm tracking-wide shadow-card active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
          >
            {loading ? (
              <span className='inline-flex items-center gap-2'>
                <span className='inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                <span>Signing in...</span>
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
        <div className='mt-6 pt-5 border-t border-surface-border text-center'>
          <p className='text-xs sm:text-sm text-surface-muted'>
            Don&apos;t have an account?{' '}
            <Link
              to='/register'
              className='font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors'
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
