import React, { useState, useRef } from 'react'
import { FaRegEyeSlash, FaRegEye } from 'react-icons/fa'
import { FiUser, FiMail, FiLock, FiArrowRight } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'

const Register = () => {
  const [data, setData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const isSubmittingRef = useRef(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const validValue = Boolean(
    data.name.trim() &&
    data.email.trim() &&
    data.password &&
    data.confirmPassword
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validValue || loading || isSubmittingRef.current) return

    if (data.password !== data.confirmPassword) {
      toast.error('Password and Confirm password must match')
      return
    }

    try {
      isSubmittingRef.current = true
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.register,
        data: data
      })

      if (response.data.error) {
        toast.error(response.data.message)
      }

      if (response.data.success) {
        toast.success(response.data.message)
        setData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        })
        navigate('/login')
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
      isSubmittingRef.current = false
    }
  }

  return (
    <section className='min-h-[85vh] bg-surface-50 flex items-center justify-center py-10 px-4 sm:px-6'>
      <div className='w-full max-w-md bg-white rounded-card border border-surface-border shadow-card p-6 sm:p-8 animate-fadeIn'>
        {/* Header Branding */}
        <div className='text-center mb-6'>
          <div className='mb-4 flex justify-center'>
            <Logo size='sm' showTagline={false} />
          </div>
          <h1 className='text-xl sm:text-2xl font-bold text-surface-title tracking-tight'>
            Create Your Account
          </h1>
          <p className='text-xs sm:text-sm text-surface-muted mt-1'>
            Sign up to get fresh groceries delivered to your door in minutes
          </p>
        </div>

        {/* Register Form */}
        <form className='space-y-4' onSubmit={handleSubmit} noValidate>
          {/* Name Field */}
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
                autoComplete='name'
                autoFocus
                required
                disabled={loading}
                value={data.name}
                onChange={handleChange}
                placeholder='John Doe'
                className='input-field pl-10'
              />
            </div>
          </div>

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
            <label
              htmlFor='password'
              className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'
            >
              Password
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-muted'>
                <FiLock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id='password'
                name='password'
                autoComplete='new-password'
                required
                disabled={loading}
                value={data.password}
                onChange={handleChange}
                placeholder='Create a secure password'
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

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor='confirmPassword'
              className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'
            >
              Confirm Password
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-muted'>
                <FiLock size={16} />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id='confirmPassword'
                name='confirmPassword'
                autoComplete='new-password'
                required
                disabled={loading}
                value={data.confirmPassword}
                onChange={handleChange}
                placeholder='Re-enter your password'
                className='input-field pl-10 pr-10'
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                className='absolute inset-y-0 right-0 pr-3.5 flex items-center text-surface-muted hover:text-surface-title transition-colors cursor-pointer min-w-[36px] min-h-[36px] justify-center'
              >
                {showConfirmPassword ? <FaRegEye size={16} /> : <FaRegEyeSlash size={16} />}
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
                <span>Creating account...</span>
              </span>
            ) : (
              <>
                <span>Create Account</span>
                <FiArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className='mt-6 pt-5 border-t border-surface-border text-center'>
          <p className='text-xs sm:text-sm text-surface-muted'>
            Already have an account?{' '}
            <Link
              to='/login'
              className='font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors'
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Register
