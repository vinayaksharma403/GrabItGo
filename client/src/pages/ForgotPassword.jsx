import React, { useState, useRef } from 'react'
import { FiMail, FiArrowRight, FiArrowLeft } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'

const ForgotPassword = () => {
  const [data, setData] = useState({
    email: ''
  })
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

  const validValue = Boolean(data.email.trim())

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validValue || loading || isSubmittingRef.current) return

    try {
      isSubmittingRef.current = true
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.forgot_password,
        data: data
      })

      if (response.data.error) {
        toast.error(response.data.message)
      }

      if (response.data.success) {
        toast.success(response.data.message)
        navigate('/verification-otp', {
          state: {
            email: data.email
          }
        })
        setData({
          email: ''
        })
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
            Forgot Password?
          </h1>
          <p className='text-xs sm:text-sm text-surface-muted mt-1.5 leading-relaxed'>
            Enter your registered email and we&apos;ll send you a 6-digit verification code to reset your password.
          </p>
        </div>

        {/* Forgot Password Form */}
        <form className='space-y-4' onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor='email'
              className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'
            >
              Registered Email
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

          {/* Submit Button */}
          <button
            type='submit'
            disabled={!validValue || loading}
            className='btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-2 font-semibold text-sm tracking-wide shadow-card active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
          >
            {loading ? (
              <span className='inline-flex items-center gap-2'>
                <span className='inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                <span>Sending code...</span>
              </span>
            ) : (
              <>
                <span>Send Verification Code</span>
                <FiArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Navigation Link */}
        <div className='mt-6 pt-5 border-t border-surface-border text-center'>
          <Link
            to='/login'
            className='inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-surface-muted hover:text-brand-600 transition-colors'
          >
            <FiArrowLeft size={16} />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ForgotPassword
