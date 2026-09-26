import React, { useState } from 'react'
import { FiKey, FiMail, FiArrowRight, FiArrowLeft } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { Link, useNavigate } from 'react-router-dom'

const ForgotPassword = () => {
  const [data, setData] = useState({
    email: ''
  })
  const [loading, setLoading] = useState(false)
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
    if (!validValue || loading) return

    try {
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
    }
  }

  return (
    <section className='min-h-[80vh] flex items-center justify-center py-10 px-4 sm:px-6'>
      <div className='w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 sm:p-8 animate-fadeIn'>
        {/* Header Branding */}
        <div className='text-center mb-6'>
          <div className='inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 text-amber-600 mb-3 shadow-subtle'>
            <FiKey size={22} />
          </div>
          <h1 className='text-2xl font-bold text-slate-900 tracking-tight'>
            Forgot Password?
          </h1>
          <p className='text-sm text-slate-500 mt-1.5 leading-relaxed'>
            Enter your registered email and we&apos;ll send you a 6-digit verification code to reset your password.
          </p>
        </div>

        {/* Forgot Password Form */}
        <form className='space-y-4' onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor='email'
              className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5'
            >
              Registered Email
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
                Sending OTP...
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
        <div className='mt-6 pt-5 border-t border-slate-100 text-center'>
          <Link
            to='/login'
            className='inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors'
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
