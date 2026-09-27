import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiCheckCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import Logo from '../components/Logo'

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('Verifying your email address...')

  useEffect(() => {
    let isMounted = true

    const verify = async () => {
      if (!code) {
        if (isMounted) {
          setStatus('error')
          setMessage('No verification code provided in URL.')
        }
        return
      }

      try {
        const response = await Axios({
          ...SummaryApi.verifyEmail,
          data: { code }
        })

        if (!isMounted) return

        if (response.data.success) {
          setStatus('success')
          setMessage(response.data.message || 'Email verified successfully!')
        } else {
          setStatus('error')
          setMessage(response.data.message || 'Verification failed. The link may be invalid or expired.')
        }
      } catch (error) {
        if (!isMounted) return
        setStatus('error')
        setMessage(error?.response?.data?.message || 'Verification failed. Please try again.')
      }
    }

    verify()

    return () => {
      isMounted = false
    }
  }, [code])

  return (
    <section className='min-h-[80vh] flex items-center justify-center py-10 px-4 sm:px-6 bg-surface-50'>
      <div className='w-full max-w-md bg-white rounded-card border border-surface-border shadow-modal p-6 sm:p-8 text-center animate-fadeIn'>
        {/* Brand Logo */}
        <div className='flex justify-center mb-6'>
          <Logo size='md' />
        </div>

        {status === 'loading' && (
          <div className='py-4'>
            <div className='inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-50 text-brand-600 mb-4 shadow-subtle'>
              <svg
                className='animate-spin h-7 w-7 text-brand-600'
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
            </div>
            <h1 className='text-xl font-bold text-surface-title mb-2'>
              Verifying Your Email
            </h1>
            <p className='text-sm text-surface-muted leading-relaxed'>
              Please wait while we confirm your email address.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className='py-2 animate-fadeIn'>
            <div className='inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-100 text-brand-600 mb-4 shadow-subtle'>
              <FiCheckCircle size={32} />
            </div>
            <h1 className='text-2xl font-bold text-surface-title mb-2'>
              Email Verified!
            </h1>
            <p className='text-sm text-surface-muted mb-6 leading-relaxed'>
              {message} Your GrabItGo account is now fully active.
            </p>
            <Link
              to='/login'
              className='btn-primary w-full py-2.5 flex items-center justify-center gap-2 font-semibold text-sm'
            >
              <span>Proceed to Login</span>
              <FiArrowRight size={16} />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className='py-2 animate-fadeIn'>
            <div className='inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-50 text-rose-600 mb-4 shadow-subtle'>
              <FiAlertCircle size={32} />
            </div>
            <h1 className='text-2xl font-bold text-surface-title mb-2'>
              Verification Failed
            </h1>
            <p className='text-sm text-surface-muted mb-6 leading-relaxed'>
              {message}
            </p>
            <div className='flex flex-col sm:flex-row gap-3'>
              <Link
                to='/'
                className='btn-secondary flex-1 py-2.5 text-center text-sm font-semibold'
              >
                Go to Home
              </Link>
              <Link
                to='/login'
                className='btn-primary flex-1 py-2.5 text-center text-sm font-semibold'
              >
                Go to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default VerifyEmail
