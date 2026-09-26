import React, { useEffect, useState, useCallback } from 'react'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { useSelector } from 'react-redux'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { loadStripe } from '@stripe/stripe-js'
import NoData from '../components/NoData'
import {
  FiMinus,
  FiPlus,
  FiTrash2,
  FiLock,
  FiTruck,
  FiAlertCircle,
  FiX,
  FiCreditCard,
  FiMapPin
} from 'react-icons/fi'
import { LuPackage, LuShoppingBag } from 'react-icons/lu'

// Stripe Payment Modal Component
const StripePaymentModal = ({ clientSecret, publishableKey, order, onClose, onSuccess }) => {
  const [stripe, setStripe] = useState(null)
  const [elements, setElements] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    let unmounted = false
    const initStripe = async () => {
      try {
        if (!publishableKey) {
          setErrorMessage('Stripe publishable key is missing')
          return
        }
        const stripeInstance = await loadStripe(publishableKey)
        if (unmounted || !stripeInstance) return
        setStripe(stripeInstance)

        const elementsInstance = stripeInstance.elements({ clientSecret })
        setElements(elementsInstance)

        const paymentElement = elementsInstance.create('payment')
        paymentElement.mount('#stripe-payment-element-container')
        setIsMounted(true)
      } catch (err) {
        setErrorMessage(err.message || 'Failed to initialize payment form')
      }
    }

    initStripe()
    return () => {
      unmounted = true
    }
  }, [clientSecret, publishableKey])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements || isProcessing) return

    setIsProcessing(true)
    setErrorMessage('')

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/myorders`,
        },
        redirect: 'if_required',
      })

      if (error) {
        setErrorMessage(error.message || 'Payment failed. Please try again.')
      } else if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
        toast.success('Payment successful! Your order has been placed.')
        onSuccess()
      } else {
        toast.success('Payment processed successfully!')
        onSuccess()
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby='stripe-modal-title'
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !isProcessing) onClose?.()
      }}
      className='fixed inset-0 bg-surface-title/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn'
    >
      <div className='bg-white rounded-card max-w-lg w-full p-5 sm:p-6 shadow-modal border border-surface-border relative my-auto max-h-[92vh] overflow-y-auto'>
        {/* Modal Header */}
        <div className='flex justify-between items-center mb-4 border-b border-surface-border pb-3'>
          <div>
            <h2 id='stripe-modal-title' className='text-base sm:text-lg font-bold text-surface-title'>
              Complete Secure Payment
            </h2>
            <p className='text-xs text-surface-muted'>Order #{order?.orderId || order?._id}</p>
          </div>
          <button
            type='button'
            onClick={onClose}
            disabled={isProcessing}
            aria-label='Close payment modal'
            className='p-1.5 rounded-full text-surface-muted hover:text-surface-title hover:bg-surface-50 transition-colors cursor-pointer disabled:opacity-50'
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Amount Summary */}
        <div className='mb-4 bg-surface-50 border border-surface-border rounded-control p-3.5 flex justify-between items-center'>
          <span className='text-xs sm:text-sm text-surface-muted font-medium'>Total Payable Amount:</span>
          <span className='text-base sm:text-lg font-extrabold text-brand-700'>
            {DisplayPriceInRupees(order?.totalAmt)}
          </span>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div id='stripe-payment-element-container' className='min-h-[200px]'>
            {!isMounted && !errorMessage && (
              <div className='flex flex-col justify-center items-center h-48 gap-2 text-surface-muted'>
                <div className='inline-block w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin' />
                <span className='text-xs font-medium'>Loading secure payment options...</span>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className='bg-rose-50 text-rose-800 text-xs sm:text-sm p-3 rounded-control border border-rose-200 flex items-start gap-2'>
              <FiAlertCircle size={16} className='text-rose-600 mt-0.5 shrink-0' />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className='flex gap-3 pt-2'>
            <button
              type='button'
              onClick={onClose}
              disabled={isProcessing}
              className='btn-outline flex-1 py-2.5 text-xs sm:text-sm font-semibold'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isProcessing || !isMounted}
              className='btn-primary flex-1 py-2.5 text-xs sm:text-sm font-semibold shadow-card flex items-center justify-center gap-2'
            >
              {isProcessing ? (
                <>
                  <span className='inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FiLock size={15} />
                  <span>Pay {DisplayPriceInRupees(order?.totalAmt)}</span>
                </>
              )}
            </button>
          </div>
        </form>

        <p className='text-center text-[11px] text-surface-muted mt-3 flex items-center justify-center gap-1'>
          <FiLock size={12} />
          <span>256-bit encrypted checkout powered by Stripe</span>
        </p>
      </div>
    </div>
  )
}

// Cart Item Component with Image Error Handling
const CartItemRow = ({ item, updatingId, onUpdateQty, onRemove }) => {
  const [imgError, setImgError] = useState(false)
  const product = item?.productId || {}
  const originalPrice = Number(product.price) || 0
  const discount = Number(product.discount) || 0
  const discountedPrice = discount > 0 ? originalPrice - (originalPrice * discount) / 100 : originalPrice
  const itemAvailable = item.isAvailable !== false && (product.stock ?? 0) >= item.quantity
  const isUpdating = updatingId === item._id

  return (
    <div
      className={`bg-white p-3.5 sm:p-4 rounded-card shadow-subtle border transition-all ${
        !itemAvailable ? 'border-rose-300 bg-rose-50/20' : 'border-surface-border hover:border-surface-300'
      } flex gap-3 sm:gap-4`}
    >
      {/* Product Image Frame */}
      <div className='w-20 h-20 sm:w-24 sm:h-24 bg-surface-50 rounded-xl border border-surface-border/70 flex items-center justify-center p-1.5 shrink-0 overflow-hidden relative'>
        {!imgError && product.image?.[0] ? (
          <img
            src={product.image[0]}
            alt={product.name || 'Product'}
            onError={() => setImgError(true)}
            className='w-full h-full object-contain'
            loading='lazy'
          />
        ) : (
          <div className='flex flex-col items-center justify-center text-surface-muted p-1 text-center'>
            <LuPackage size={24} className='text-surface-muted/60 mb-0.5' />
            <span className='text-[9px] font-medium'>No Image</span>
          </div>
        )}

        {discount > 0 && (
          <span className='absolute top-1 left-1 badge-accent text-[9px] font-bold px-1 py-0.2 rounded'>
            {discount}% OFF
          </span>
        )}
      </div>

      {/* Item Details & Actions */}
      <div className='flex-1 min-w-0 flex flex-col justify-between'>
        <div>
          <div className='flex justify-between items-start gap-2'>
            <div>
              <Link
                to={`/product/${product._id}`}
                className='font-semibold text-xs sm:text-sm text-surface-title hover:text-brand-700 transition-colors line-clamp-2'
              >
                {product.name || 'Product Item'}
              </Link>
              {product.unit && (
                <p className='text-[11px] text-surface-muted mt-0.5'>{product.unit}</p>
              )}
            </div>

            {!itemAvailable && (
              <span className='badge-error text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0'>
                Insufficient Stock
              </span>
            )}
          </div>

          <div className='flex items-baseline gap-2 mt-1'>
            <p className='font-bold text-xs sm:text-sm text-surface-title'>
              {DisplayPriceInRupees(discountedPrice)}
            </p>
            {discount > 0 && (
              <p className='text-[11px] line-through text-surface-muted'>
                {DisplayPriceInRupees(originalPrice)}
              </p>
            )}
          </div>
        </div>

        {/* Quantity Stepper & Remove CTA */}
        <div className='flex items-center justify-between mt-3 pt-2 border-t border-surface-border/50'>
          <div className='inline-flex items-center border border-surface-border rounded-control bg-surface-50/70 shadow-xs overflow-hidden'>
            <button
              type='button'
              onClick={() => onUpdateQty(item._id, item.quantity - 1)}
              disabled={item.quantity <= 1 || isUpdating}
              aria-label={`Decrease quantity of ${product.name}`}
              className='p-1.5 sm:p-2 text-surface-title hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer min-w-[28px] sm:min-w-[32px] flex items-center justify-center'
            >
              <FiMinus size={12} />
            </button>
            <span className='font-bold text-xs sm:text-sm px-2.5 sm:px-3 text-surface-title select-none min-w-[24px] text-center'>
              {isUpdating ? '...' : item.quantity}
            </span>
            <button
              type='button'
              onClick={() => onUpdateQty(item._id, item.quantity + 1)}
              disabled={Boolean(product.stock && item.quantity >= product.stock) || isUpdating}
              aria-label={`Increase quantity of ${product.name}`}
              className='p-1.5 sm:p-2 text-surface-title hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer min-w-[28px] sm:min-w-[32px] flex items-center justify-center'
            >
              <FiPlus size={12} />
            </button>
          </div>

          <button
            type='button'
            onClick={() => onRemove(item._id)}
            disabled={isUpdating}
            aria-label={`Remove ${product.name} from cart`}
            className='inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-control text-xs font-semibold transition-colors cursor-pointer'
          >
            <FiTrash2 size={13} />
            <span>Remove</span>
          </button>
        </div>
      </div>
    </div>
  )
}

const Cart = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [checkoutErrors, setCheckoutErrors] = useState([])
  const [stripePaymentData, setStripePaymentData] = useState(null)

  const user = useSelector((state) => state.user)
  const addressList = useSelector((state) => state.addresses.addressList)
  const navigate = useNavigate()

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.getCart,
      })
      const { data: responseData } = response
      if (responseData.success) {
        setData(responseData.data || [])
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (addressList && addressList.length > 0) {
      setSelectedAddressId((prev) => prev || addressList[0]._id)
    }
  }, [addressList])

  const updateQuantity = async (cartId, quantity) => {
    try {
      setUpdatingId(cartId)
      const response = await Axios({
        ...SummaryApi.updateCart,
        data: { cartId, quantity },
      })
      const { data: responseData } = response
      if (responseData.success) {
        setCheckoutErrors([])
        fetchCart()
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setUpdatingId(null)
    }
  }

  const removeItem = async (cartId) => {
    try {
      setUpdatingId(cartId)
      const response = await Axios({
        ...SummaryApi.removeFromCart,
        data: { cartId },
      })
      const { data: responseData } = response
      if (responseData.success) {
        toast.success('Removed from cart')
        setCheckoutErrors([])
        fetchCart()
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setUpdatingId(null)
    }
  }

  const validItems = data.filter((item) => Boolean(item.productId))

  const totalQty = validItems.reduce((prev, curr) => prev + (Number(curr.quantity) || 0), 0)
  const totalPrice = validItems.reduce((prev, curr) => {
    const price = Number(curr.productId?.price) || 0
    const discount = Number(curr.productId?.discount) || 0
    const unitPrice = discount > 0 ? price - (price * discount) / 100 : price
    return prev + unitPrice * (Number(curr.quantity) || 0)
  }, 0)

  const handleCheckout = async () => {
    if (!user?._id) {
      toast.error('Please login to proceed to checkout')
      navigate('/login')
      return
    }

    if (validItems.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    const addressId =
      selectedAddressId ||
      addressList?.[0]?._id ||
      (typeof user.address_details?.[0] === 'object'
        ? user.address_details[0]?._id
        : user.address_details?.[0])

    if (!addressId) {
      toast.error('Please add a delivery address before proceeding')
      navigate('/dashboard/address')
      return
    }

    try {
      setCheckoutLoading(true)
      setCheckoutErrors([])

      const response = await Axios({
        ...SummaryApi.createOrder,
        data: { addressId },
      })

      const { data: responseData } = response
      if (responseData.success) {
        const { order, clientSecret, publishableKey } = responseData.data

        if (clientSecret && publishableKey) {
          // Launch Stripe Payment Modal
          setStripePaymentData({
            clientSecret,
            publishableKey,
            order,
          })
        } else {
          toast.success('Order placed successfully!')
          navigate('/dashboard/myorders')
        }
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        setCheckoutErrors(error.response.data.errors)
        toast.error(error.response.data.message || 'Please fix issues in your cart before checkout.')
      } else {
        AxiosToastError(error)
      }
    } finally {
      setCheckoutLoading(false)
    }
  }

  useEffect(() => {
    if (user?._id) {
      fetchCart()
    }
  }, [user?._id, fetchCart])

  return (
    <section className='min-h-[calc(100vh-80px)] bg-surface-50 py-6 sm:py-8'>
      <div className='container mx-auto px-3 sm:px-6 max-w-6xl'>
        {/* Header Title */}
        <div className='flex items-center justify-between mb-5 flex-wrap gap-2'>
          <div>
            <h1 className='font-bold text-xl sm:text-2xl text-surface-title tracking-tight'>
              Your Shopping Cart
            </h1>
            <p className='text-xs sm:text-sm text-surface-muted'>
              Review items and complete your order with fast local dispatch
            </p>
          </div>
          {validItems.length > 0 && (
            <span className='badge-neutral text-xs font-semibold px-2.5 py-1'>
              {totalQty} {totalQty === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {/* Validation Errors Banner */}
        {checkoutErrors.length > 0 && (
          <div className='bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-card mb-5 shadow-xs'>
            <div className='flex items-center gap-2 font-bold text-sm mb-1'>
              <FiAlertCircle size={16} className='text-rose-600' />
              <h4>Unable to proceed with checkout:</h4>
            </div>
            <ul className='list-disc list-inside text-xs space-y-1 ml-4'>
              {checkoutErrors.map((err, idx) => (
                <li key={idx}>
                  <strong>{err.name || 'Product'}</strong>: {err.reason} (Requested:{' '}
                  {err.requestedQuantity}, In Stock: {err.availableStock})
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className='flex flex-col items-center justify-center py-20 gap-3'>
            <div className='inline-block w-10 h-10 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin' />
            <span className='text-xs font-semibold text-surface-muted'>Loading your cart...</span>
          </div>
        ) : validItems.length === 0 ? (
          /* Empty Cart State */
          <div className='py-16 bg-white rounded-card shadow-subtle border border-surface-border my-4'>
            <NoData
              icon={<LuShoppingBag size={48} className='text-brand-600' />}
              title='Your Cart is Empty'
              description='Add everyday fresh groceries, snacks, and essentials to get started.'
              actionText='Explore Products'
              actionHref='/'
            />
          </div>
        ) : (
          /* Two-Column Cart Layout */
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
            {/* LEFT COLUMN: Cart Items */}
            <div className='lg:col-span-7 xl:col-span-8 space-y-3'>
              {validItems.map((item) => (
                <CartItemRow
                  key={item._id}
                  item={item}
                  updatingId={updatingId}
                  onUpdateQty={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>

            {/* RIGHT COLUMN: Address & Order Summary */}
            <div className='lg:col-span-5 xl:col-span-4 space-y-4'>
              {/* Delivery Address Selector */}
              <div className='bg-white p-4 sm:p-5 rounded-card shadow-subtle border border-surface-border'>
                <div className='flex justify-between items-center mb-3 pb-2 border-b border-surface-border/60'>
                  <div className='flex items-center gap-1.5'>
                    <FiMapPin size={16} className='text-brand-600' />
                    <h2 className='font-bold text-sm text-surface-title'>Delivery Address</h2>
                  </div>
                  <Link
                    to='/dashboard/address'
                    className='text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors'
                  >
                    + Manage
                  </Link>
                </div>

                {addressList && addressList.length > 0 ? (
                  <div className='space-y-2'>
                    {addressList.map((addr) => {
                      const isSelected = selectedAddressId === addr._id
                      return (
                        <label
                          key={addr._id}
                          className={`block p-3 rounded-control border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20 shadow-xs'
                              : 'border-surface-border hover:border-surface-300 bg-surface-50/50'
                          }`}
                        >
                          <div className='flex items-start gap-2.5'>
                            <input
                              type='radio'
                              name='deliveryAddress'
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addr._id)}
                              className='mt-0.5 text-brand-600 focus:ring-brand-500 accent-brand-600'
                            />
                            <div>
                              <p className='font-semibold text-surface-title'>{addr.address_line}</p>
                              <p className='text-surface-muted mt-0.5'>
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <div className='text-center py-4 bg-surface-50 rounded-control border border-surface-border/60'>
                    <p className='text-xs text-surface-muted mb-2'>No delivery address on file</p>
                    <Link
                      to='/dashboard/address'
                      className='inline-block text-xs btn-primary px-3 py-1.5'
                    >
                      Add New Address
                    </Link>
                  </div>
                )}
              </div>

              {/* Order Summary Card */}
              <div className='bg-white p-4 sm:p-5 rounded-card shadow-subtle border border-surface-border'>
                <h2 className='font-bold text-base text-surface-title mb-4 pb-2 border-b border-surface-border/60'>
                  Order Summary
                </h2>

                <div className='space-y-2.5 text-xs sm:text-sm'>
                  <div className='flex justify-between text-surface-muted'>
                    <span>Items Total ({totalQty} items):</span>
                    <span className='font-medium text-surface-title'>
                      {DisplayPriceInRupees(totalPrice)}
                    </span>
                  </div>

                  <div className='flex justify-between text-surface-muted'>
                    <span>Delivery Charges:</span>
                    <span className='text-brand-700 font-bold'>FREE</span>
                  </div>

                  <div className='border-t border-surface-border/80 pt-3 flex justify-between items-baseline'>
                    <span className='font-bold text-sm sm:text-base text-surface-title'>
                      Total Payable:
                    </span>
                    <span className='text-lg sm:text-xl font-extrabold text-brand-700'>
                      {DisplayPriceInRupees(totalPrice)}
                    </span>
                  </div>
                </div>

                <button
                  type='button'
                  onClick={handleCheckout}
                  disabled={checkoutLoading || validItems.length === 0}
                  className='btn-primary w-full py-3 text-sm sm:text-base font-semibold mt-5 shadow-card flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                >
                  {checkoutLoading ? (
                    <>
                      <span className='inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                      <span>Preparing Checkout...</span>
                    </>
                  ) : (
                    <>
                      <FiCreditCard size={18} />
                      <span>Proceed to Pay ({DisplayPriceInRupees(totalPrice)})</span>
                    </>
                  )}
                </button>

                {/* Trust Highlight Chips */}
                <div className='mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between text-[11px] text-surface-muted'>
                  <span className='flex items-center gap-1'>
                    <FiTruck size={13} className='text-brand-600' /> 10-Min Fast Delivery
                  </span>
                  <span className='flex items-center gap-1'>
                    <FiLock size={13} className='text-brand-600' /> Stripe Secured
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stripe Payment Modal */}
        {stripePaymentData && (
          <StripePaymentModal
            clientSecret={stripePaymentData.clientSecret}
            publishableKey={stripePaymentData.publishableKey}
            order={stripePaymentData.order}
            onClose={() => setStripePaymentData(null)}
            onSuccess={() => {
              setStripePaymentData(null)
              navigate('/dashboard/myorders')
            }}
          />
        )}
      </div>
    </section>
  )
}

export default Cart
