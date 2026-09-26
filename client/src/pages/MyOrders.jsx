import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  FiPackage,
  FiCalendar,
  FiMapPin,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiCopy
} from 'react-icons/fi'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import NoData from '../components/NoData'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import toast from 'react-hot-toast'

const MyOrders = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.getOrders
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
    fetchOrders()
  }, [fetchOrders])

  const copyOrderId = (orderId) => {
    navigator.clipboard.writeText(orderId)
    toast.success('Order ID copied to clipboard')
  }

  const renderStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase()
    if (s === 'paid') {
      return (
        <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60'>
          <FiCheckCircle size={13} />
          <span>Paid</span>
        </span>
      )
    }
    if (s === 'pending') {
      return (
        <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60'>
          <FiClock size={13} />
          <span>Payment Pending</span>
        </span>
      )
    }
    return (
      <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60'>
        <FiAlertCircle size={13} />
        <span className='capitalize'>{status || 'Failed'}</span>
      </span>
    )
  }

  return (
    <div className='space-y-6 animate-fadeIn'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
        <div>
          <h1 className='text-2xl font-bold text-slate-900 tracking-tight'>
            My Orders
          </h1>
          <p className='text-sm text-slate-500 mt-1'>
            Track your quick-commerce purchases and view order summaries
          </p>
        </div>
        {!loading && data.length > 0 && (
          <span className='inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold self-start sm:self-auto'>
            <FiPackage size={14} />
            <span>{data.length} {data.length === 1 ? 'Order' : 'Orders'}</span>
          </span>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className='space-y-4'>
          {[1, 2].map((n) => (
            <div
              key={n}
              className='bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-card animate-pulse space-y-4'
            >
              <div className='flex justify-between items-center pb-4 border-b border-slate-100'>
                <div className='space-y-2'>
                  <div className='h-4 bg-slate-200 rounded w-36'></div>
                  <div className='h-3 bg-slate-100 rounded w-24'></div>
                </div>
                <div className='h-6 bg-slate-200 rounded-full w-20'></div>
              </div>
              <div className='space-y-3 py-2'>
                <div className='flex items-center gap-3'>
                  <div className='w-14 h-14 bg-slate-200 rounded-xl'></div>
                  <div className='flex-1 space-y-1.5'>
                    <div className='h-3.5 bg-slate-200 rounded w-1/2'></div>
                    <div className='h-3 bg-slate-100 rounded w-1/4'></div>
                  </div>
                  <div className='h-4 bg-slate-200 rounded w-16'></div>
                </div>
              </div>
              <div className='pt-3 border-t border-slate-100 flex justify-between'>
                <div className='h-4 bg-slate-200 rounded w-20'></div>
                <div className='h-5 bg-slate-200 rounded w-24'></div>
              </div>
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className='bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 sm:p-12'>
          <NoData
            icon={FiPackage}
            title='No Orders Placed Yet'
            description='You have not placed any orders yet. Explore our grocery catalog and get your essentials delivered in minutes!'
            actionText='Start Shopping'
            actionHref='/'
          />
        </div>
      ) : (
        <div className='space-y-5'>
          {data.map((order) => {
            const formattedDate = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Recent Order'

            return (
              <div
                key={order._id}
                className='bg-white rounded-2xl border border-slate-200/80 shadow-card hover:border-slate-300 transition-all p-5 sm:p-6'
              >
                {/* Order Top Bar */}
                <div className='flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100'>
                  <div>
                    <div className='flex items-center gap-2'>
                      <span className='font-bold text-slate-900 text-sm sm:text-base'>
                        Order #{order.orderId}
                      </span>
                      <button
                        type='button'
                        onClick={() => copyOrderId(order.orderId)}
                        className='text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer'
                        title='Copy Order ID'
                        aria-label='Copy Order ID'
                      >
                        <FiCopy size={13} />
                      </button>
                    </div>
                    <div className='flex items-center gap-1.5 text-xs text-slate-500 mt-0.5'>
                      <FiCalendar size={13} className='text-slate-400' />
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                  <div>{renderStatusBadge(order.payment_status)}</div>
                </div>

                {/* Items List */}
                <div className='divide-y divide-slate-100 py-3'>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => {
                      const imageSrc =
                        Array.isArray(item.image) && item.image.length > 0
                          ? item.image[0]
                          : typeof item.image === 'string' && item.image
                          ? item.image
                          : '/placeholder.png'

                      return (
                        <div
                          key={item.productId || item._id || idx}
                          className='flex items-center gap-3.5 py-3'
                        >
                          <div className='w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center'>
                            <img
                              src={imageSrc}
                              alt={item.name || 'Order Item'}
                              loading='lazy'
                              onError={(e) => {
                                if (e.target.src !== '/placeholder.png') {
                                  e.target.src = '/placeholder.png'
                                }
                              }}
                              className='w-full h-full object-contain p-1'
                            />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <h3 className='font-semibold text-slate-800 text-xs sm:text-sm truncate'>
                              {item.name}
                            </h3>
                            <p className='text-xs text-slate-500 mt-0.5'>
                              Qty: {item.quantity} × {DisplayPriceInRupees(item.unitPrice)}
                            </p>
                          </div>
                          <div className='font-bold text-slate-900 text-xs sm:text-sm'>
                            {DisplayPriceInRupees(
                              item.lineTotal || (item.unitPrice || 0) * (item.quantity || 1)
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : order.product_details ? (
                    <div className='flex items-center gap-3.5 py-3'>
                      <div className='w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center'>
                        <img
                          src={order.product_details?.image?.[0] || '/placeholder.png'}
                          alt={order.product_details?.name || 'Order Item'}
                          loading='lazy'
                          onError={(e) => {
                            if (e.target.src !== '/placeholder.png') {
                              e.target.src = '/placeholder.png'
                            }
                          }}
                          className='w-full h-full object-contain p-1'
                        />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <h3 className='font-semibold text-slate-800 text-xs sm:text-sm truncate'>
                          {order.product_details?.name}
                        </h3>
                        <p className='text-xs text-slate-500 mt-0.5'>
                          Quantity: {order.product_details?.quantity || 1}
                        </p>
                      </div>
                      <div className='font-bold text-slate-900 text-xs sm:text-sm'>
                        {DisplayPriceInRupees(order.product_details?.price)}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Delivery Address Box */}
                {order.delivery_address && (
                  <div className='bg-slate-50 rounded-xl p-3 mb-4 flex items-start gap-2.5 text-xs text-slate-600 border border-slate-100'>
                    <FiMapPin size={15} className='text-emerald-600 shrink-0 mt-0.5' />
                    <div>
                      <span className='font-semibold text-slate-800'>Delivered to: </span>
                      {typeof order.delivery_address === 'object' ? (
                        <span>
                          {order.delivery_address.address_line},{' '}
                          {order.delivery_address.city} {order.delivery_address.pincode}
                        </span>
                      ) : (
                        <span>Saved Address</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Summary Footer */}
                <div className='pt-3 border-t border-slate-100 space-y-1.5 text-xs'>
                  <div className='flex justify-between text-slate-500'>
                    <span>Items Subtotal:</span>
                    <span className='font-medium text-slate-700'>
                      {DisplayPriceInRupees(order.subTotalAmt || order.totalAmt || 0)}
                    </span>
                  </div>
                  <div className='flex justify-between text-slate-500'>
                    <span>Delivery Fee:</span>
                    <span className='font-semibold text-emerald-600'>FREE</span>
                  </div>
                  <div className='flex justify-between items-center text-sm font-bold text-slate-900 pt-2 border-t border-dashed border-slate-200'>
                    <span>Total Paid:</span>
                    <span className='text-base text-emerald-700'>
                      {DisplayPriceInRupees(order.totalAmt || order.subTotalAmt || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MyOrders
