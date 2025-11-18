import React, { useEffect, useState } from 'react'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { useSelector } from 'react-redux'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { loadStripe } from '@stripe/stripe-js'

const Cart = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const user = useSelector(state => state.user)
  const navigate = useNavigate()

  const fetchCart = async () => {
    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.getCart
      })
      const { data: responseData } = response
      if (responseData.success) {
        setData(responseData.data)
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (cartId, quantity) => {
    try {
      const response = await Axios({
        ...SummaryApi.updateCart,
        data: { cartId, quantity }
      })
      const { data: responseData } = response
      if (responseData.success) {
        fetchCart()
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  const removeItem = async (cartId) => {
    try {
      const response = await Axios({
        ...SummaryApi.removeFromCart,
        data: { cartId }
      })
      const { data: responseData } = response
      if (responseData.success) {
        toast.success("Removed from cart")
        fetchCart()
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  const totalQty = data.reduce((prev, curr) => prev + curr.quantity, 0)
  const totalPrice = data.reduce((prev, curr) => prev + (curr.productId.price * curr.quantity), 0)

  const handleCheckout = async () => {
    if (!user._id) {
      navigate('/login')
      return
    }

    if (data.length === 0) {
      toast.error('Cart is empty')
      return
    }

    try {
      setCheckoutLoading(true)

      // For simplicity, use the first address or redirect to address selection
      const addressId = user.address_details?.[0]?._id
      if (!addressId) {
        toast.error('Please add a delivery address')
        navigate('/dashboard/address')
        return
      }

      const response = await Axios({
        ...SummaryApi.createOrder,
        data: { addressId }
      })

      const { data: responseData } = response
      if (responseData.success) {
        const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here')
        const { clientSecret } = responseData.data

        // Redirect to Stripe checkout or handle payment
        toast.success('Order created! Payment processing...')
        // For now, just show success and clear cart
        fetchCart()
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setCheckoutLoading(false)
    }
  }

  useEffect(() => {
    if (user._id) {
      fetchCart()
    }
  }, [user])

  return (
    <div className='container mx-auto px-4 py-4'>
      <div className='text-center py-4'>
        <h2 className='font-semibold text-2xl'>Your Cart</h2>
      </div>

      {loading ? (
        <div className='flex justify-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-600'></div>
        </div>
      ) : data.length === 0 ? (
        <div className='text-center py-8'>
          <p className='text-gray-500'>Your cart is empty</p>
          <Link to="/" className='text-green-600 hover:text-green-500'>Continue Shopping</Link>
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          {/* Cart Items */}
          <div className='lg:col-span-2'>
            {data.map((item) => (
              <div key={item._id} className='bg-white p-4 rounded-lg shadow mb-4 flex gap-4'>
                <img
                  src={item.productId.image[0]}
                  alt={item.productId.name}
                  className='w-20 h-20 object-cover rounded'
                />
                <div className='flex-1'>
                  <h3 className='font-medium'>{item.productId.name}</h3>
                  <p className='text-sm text-gray-500'>{item.productId.unit}</p>
                  <p className='font-semibold'>{DisplayPriceInRupees(item.productId.price)}</p>
                  <div className='flex items-center gap-2 mt-2'>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className='px-2 py-1 bg-gray-200 rounded disabled:opacity-50'
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className='px-2 py-1 bg-gray-200 rounded'
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item._id)}
                      className='ml-4 text-red-600 hover:text-red-500'
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className='bg-white p-4 rounded-lg shadow h-fit'>
            <h3 className='font-semibold text-lg mb-4'>Order Summary</h3>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span>Total Items:</span>
                <span>{totalQty}</span>
              </div>
              <div className='flex justify-between font-semibold'>
                <span>Total Price:</span>
                <span>{DisplayPriceInRupees(totalPrice)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className='w-full bg-green-600 text-white py-2 rounded mt-4 hover:bg-green-700 disabled:opacity-50'
            >
              {checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart
