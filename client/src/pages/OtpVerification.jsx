import React, { useEffect, useRef, useState } from 'react'
import { FiShield, FiArrowRight, FiArrowLeft } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const OtpVerification = () => {
  const [data, setData] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef([])
  const location = useLocation()

  const email = location?.state?.email || ''

  useEffect(() => {
    if (!location?.state?.email) {
      navigate('/forgot-password')
    }
  }, [location, navigate])

  const validValue = data.every((el) => el.trim().length === 1)

  const handleInputChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '')
    const digit = cleaned.slice(-1)

    const newData = [...data]
    newData[index] = digit
    setData(newData)

    if (digit && index < 5 && inputRef.current[index + 1]) {
      inputRef.current[index + 1].focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !data[index] && index > 0) {
      inputRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const newData = [...data]
    for (let i = 0; i < 6; i++) {
      newData[i] = pasted[i] || ''
    }
    setData(newData)

    const nextIndex = Math.min(pasted.length, 5)
    inputRef.current[nextIndex]?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validValue || loading) return

    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.forgot_password_otp_verification,
        data: {
          otp: data.join(''),
          email: location?.state?.email
        }
      })

      if (response.data.error) {
        toast.error(response.data.message)
      }

      if (response.data.success) {
        toast.success(response.data.message)
        const resetToken = response.data?.data?.resetToken
        setData(['', '', '', '', '', ''])
        navigate('/reset-password', {
          state: {
            data: response.data,
            email: location?.state?.email,
            resetToken: resetToken
          }
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
          <div className='inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 mb-3 shadow-subtle'>
            <FiShield size={24} />
          </div>
          <h1 className='text-2xl font-bold text-slate-900 tracking-tight'>
            Enter Verification Code
          </h1>
          <p className='text-sm text-slate-500 mt-1.5 leading-relaxed'>
            We sent a 6-digit verification code to{' '}
            <span className='font-semibold text-slate-800 break-all'>{email}</span>.
          </p>
        </div>

        {/* OTP Input Form */}
        <form className='space-y-6' onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor='otp-0'
              className='block text-xs font-semibold text-slate-700 uppercase tracking-wider text-center mb-3'
            >
              6-Digit Code
            </label>
            <div className='flex items-center justify-center gap-2 sm:gap-3'>
              {data.map((_, index) => (
                <input
                  key={'otp-' + index}
                  type='text'
                  id={`otp-${index}`}
                  aria-label={`Digit ${index + 1}`}
                  inputMode='numeric'
                  autoComplete='one-time-code'
                  maxLength={1}
                  ref={(ref) => {
                    inputRef.current[index] = ref
                  }}
                  value={data[index]}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className='w-11 h-12 sm:w-12 sm:h-14 text-center font-bold text-xl text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all'
                />
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type='submit'
            disabled={!validValue || loading}
            className='btn-primary w-full py-2.5 flex items-center justify-center gap-2 font-semibold text-sm tracking-wide'
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
                Verifying OTP...
              </span>
            ) : (
              <>
                <span>Verify Code</span>
                <FiArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Navigation Link */}
        <div className='mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500'>
          <Link
            to='/forgot-password'
            className='inline-flex items-center gap-1 font-medium hover:text-slate-800 transition-colors'
          >
            <FiArrowLeft size={14} />
            <span>Change Email</span>
          </Link>
          <Link
            to='/login'
            className='font-semibold text-emerald-600 hover:text-emerald-700 transition-colors'
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </section>
  )
}

export default OtpVerification
