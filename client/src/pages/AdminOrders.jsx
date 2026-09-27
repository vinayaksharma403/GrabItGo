import React, { useState, useEffect, useCallback } from 'react'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import NoData from '../components/NoData'
import toast from 'react-hot-toast'
import {
  FiPackage,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiXCircle,
  FiEye,
  FiCopy,
  FiX,
  FiMapPin,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiCheck
} from 'react-icons/fi'

// Status badge helper component
const StatusBadge = ({ status }) => {
  const s = (status || 'pending').toLowerCase()
  if (s === 'paid') {
    return (
      <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80'>
        <FiCheckCircle size={13} />
        <span>Paid</span>
      </span>
    )
  }
  if (s === 'pending') {
    return (
      <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80'>
        <FiClock size={13} />
        <span>Pending</span>
      </span>
    )
  }
  if (s === 'cancelled') {
    return (
      <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-100 text-surface-title border border-surface-border'>
        <FiXCircle size={13} />
        <span>Cancelled</span>
      </span>
    )
  }
  return (
    <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80'>
      <FiAlertCircle size={13} />
      <span className='capitalize'>{status || 'Failed'}</span>
    </span>
  )
}

// Order Details Modal Component
const OrderDetailModal = ({ order, onClose, onStatusUpdated }) => {
  const [selectedStatus, setSelectedStatus] = useState(order?.payment_status || 'pending')
  const [updating, setUpdating] = useState(false)

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const handleUpdateStatus = async () => {
    if (selectedStatus === order.payment_status) {
      toast('Status is already ' + selectedStatus)
      return
    }

    try {
      setUpdating(true)
      const response = await Axios({
        ...SummaryApi.updateOrderStatus,
        data: {
          orderId: order.orderId || order._id,
          status: selectedStatus,
        },
      })

      if (response.data.success) {
        toast.success(response.data.message || 'Order status updated successfully')
        onStatusUpdated(response.data.data || { ...order, payment_status: selectedStatus })
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setUpdating(false)
    }
  }

  const customerName = order?.userId?.name || 'Guest / Unnamed Customer'
  const customerEmail = order?.userId?.email || 'N/A'
  const customerMobile = order?.userId?.mobile || order?.delivery_address?.mobile || 'N/A'

  const address = order?.delivery_address

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby='modal-order-title'
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose?.()
      }}
      className='fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-card max-w-2xl w-full p-5 sm:p-7 shadow-modal border border-surface-border relative my-auto max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-start justify-between gap-3 pb-4 border-b border-surface-border'>
          <div>
            <div className='flex items-center gap-2 flex-wrap'>
              <h2 id='modal-order-title' className='text-lg sm:text-xl font-bold text-surface-title'>
                Order #{order?.orderId}
              </h2>
              <button
                type='button'
                onClick={() => handleCopy(order?.orderId, 'Order ID')}
                title='Copy Order ID'
                className='text-surface-muted hover:text-surface-title p-1 rounded cursor-pointer'
              >
                <FiCopy size={14} />
              </button>
              <StatusBadge status={order?.payment_status} />
            </div>
            <p className='text-xs text-surface-muted mt-1'>
              Placed on {new Date(order?.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            aria-label='Close modal'
            className='p-1.5 rounded-control text-surface-muted hover:text-surface-title hover:bg-surface-50 transition-colors cursor-pointer'
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className='py-4 space-y-5'>
          {/* Customer & Address Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {/* Customer Info */}
            <div className='bg-surface-50 rounded-control p-3.5 border border-surface-border'>
              <div className='flex items-center gap-2 text-xs font-bold text-surface-title mb-2 uppercase tracking-wider'>
                <FiUser size={14} className='text-brand-600' />
                <span>Customer Details</span>
              </div>
              <p className='text-sm font-semibold text-surface-title'>{customerName}</p>
              <p className='text-xs text-surface-muted truncate mt-0.5'>{customerEmail}</p>
              <p className='text-xs text-surface-muted mt-0.5'>Phone: {customerMobile}</p>
            </div>

            {/* Delivery Address */}
            <div className='bg-surface-50 rounded-control p-3.5 border border-surface-border'>
              <div className='flex items-center gap-2 text-xs font-bold text-surface-title mb-2 uppercase tracking-wider'>
                <FiMapPin size={14} className='text-brand-600' />
                <span>Delivery Address</span>
              </div>
              {address ? (
                <div className='text-xs text-surface-title leading-relaxed'>
                  <p className='font-medium'>{address.address_line}</p>
                  <p>{address.city}, {address.state} - {address.pincode}</p>
                  <p className='text-surface-muted mt-0.5'>{address.country || 'India'} • Ph: {address.mobile}</p>
                </div>
              ) : (
                <p className='text-xs text-surface-muted italic'>No address record attached</p>
              )}
            </div>
          </div>

          {/* Ordered Line Items */}
          <div>
            <h3 className='text-xs font-bold text-surface-title uppercase tracking-wider mb-2.5'>
              Ordered Items ({order?.items?.length || 0})
            </h3>
            <div className='border border-surface-border rounded-control overflow-hidden divide-y divide-surface-border'>
              {order?.items?.map((item, idx) => (
                <div key={item.productId || idx} className='p-3 flex items-center justify-between gap-3 text-xs sm:text-sm hover:bg-surface-50'>
                  <div className='flex items-center gap-3 min-w-0'>
                    {item.image?.[0] ? (
                      <img
                        src={item.image[0]}
                        alt={item.name}
                        className='w-11 h-11 object-cover rounded-control bg-surface-50 shrink-0 border border-surface-border'
                      />
                    ) : (
                      <div className='w-11 h-11 rounded-control bg-surface-50 flex items-center justify-center shrink-0 text-surface-muted'>
                        <FiPackage size={18} />
                      </div>
                    )}
                    <div className='min-w-0'>
                      <p className='font-medium text-surface-title truncate'>{item.name}</p>
                      <p className='text-xs text-surface-muted'>
                        {DisplayPriceInRupees(item.unitPrice)} × {item.quantity} units
                        {item.discountPercent > 0 && (
                          <span className='ml-1.5 text-brand-700 font-semibold'>({item.discountPercent}% OFF)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className='font-bold text-surface-title shrink-0'>
                    {DisplayPriceInRupees(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className='bg-surface-50 rounded-control p-3.5 border border-surface-border space-y-1.5 text-xs sm:text-sm'>
            <div className='flex justify-between text-surface-muted'>
              <span>Items Subtotal:</span>
              <span>{DisplayPriceInRupees(order?.subTotalAmt || order?.totalAmt)}</span>
            </div>
            <div className='flex justify-between text-surface-muted'>
              <span>Delivery Fee:</span>
              <span className='text-brand-700 font-medium'>FREE</span>
            </div>
            <div className='flex justify-between font-extrabold text-surface-title text-sm sm:text-base pt-1.5 border-t border-surface-border'>
              <span>Total Payable Amount:</span>
              <span className='text-brand-700'>{DisplayPriceInRupees(order?.totalAmt)}</span>
            </div>
          </div>

          {/* Status Update Control Section */}
          <div className='bg-amber-50/70 border border-amber-200/80 rounded-control p-4'>
            <h4 className='text-xs font-bold text-amber-900 uppercase tracking-wider mb-2.5'>
              Update Order & Payment Status
            </h4>
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                disabled={updating}
                aria-label='Select new order status'
                className='input-field py-2 text-xs sm:text-sm bg-white font-medium text-surface-title'
              >
                <option value='pending'>Payment Pending (pending)</option>
                <option value='paid'>Paid & Settled (paid)</option>
                <option value='cancelled'>Cancelled (cancelled)</option>
                <option value='failed'>Payment Failed (failed)</option>
              </select>

              <button
                type='button'
                onClick={handleUpdateStatus}
                disabled={updating || selectedStatus === order.payment_status}
                className='btn-primary whitespace-nowrap text-xs sm:text-sm font-semibold px-4 py-2 cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1.5'
              >
                {updating ? (
                  <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                ) : (
                  <FiCheck size={16} />
                )}
                <span>Save Status</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='pt-3 border-t border-surface-border flex justify-end'>
          <button
            type='button'
            onClick={onClose}
            className='btn-secondary text-xs sm:text-sm px-4 py-2'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Debounce search query (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchQuery])

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const response = await Axios.get(SummaryApi.getAllOrdersAdmin.url, {
        params: {
          page,
          limit: 15,
          status: statusFilter,
          search: debouncedSearch,
        },
      })

      const { data: resData } = response
      if (resData?.success) {
        setOrders(resData.data || [])
        setTotalPages(resData.totalPages || 1)
        setTotalCount(resData.totalCount || 0)
      } else {
        setOrders([])
        setTotalPages(1)
        setTotalCount(0)
      }
    } catch (error) {
      AxiosToastError(error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, debouncedSearch])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleCopyOrderId = (id) => {
    navigator.clipboard.writeText(id)
    toast.success('Order ID copied to clipboard')
  }

  const handleStatusUpdated = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === updatedOrder._id || o.orderId === updatedOrder.orderId ? { ...o, payment_status: updatedOrder.payment_status } : o))
    )
    if (selectedOrder && (selectedOrder._id === updatedOrder._id || selectedOrder.orderId === updatedOrder.orderId)) {
      setSelectedOrder((prev) => ({ ...prev, payment_status: updatedOrder.payment_status }))
    }
  }

  const handleClearFilters = () => {
    setStatusFilter('')
    setSearchQuery('')
    setDebouncedSearch('')
    setPage(1)
  }

  return (
    <div className='space-y-6 animate-fadeIn'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-bold text-surface-title tracking-tight'>
              Customer Orders
            </h1>
            {!loading && totalCount > 0 && (
              <span className='badge-brand text-xs font-semibold px-2.5 py-0.5'>
                {totalCount} {totalCount === 1 ? 'Order' : 'Orders'}
              </span>
            )}
          </div>
          <p className='text-sm text-surface-muted mt-1'>
            Inspect real-time customer purchases, review delivery addresses, and manage fulfillment status
          </p>
        </div>

        <button
          type='button'
          onClick={fetchOrders}
          disabled={loading}
          aria-label='Refresh orders list'
          className='btn-secondary self-start sm:self-auto inline-flex items-center gap-2 text-xs sm:text-sm font-semibold'
        >
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className='bg-white rounded-card border border-surface-border shadow-card p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4'>
        {/* Search */}
        <div className='relative flex-1 max-w-md'>
          <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-muted'>
            <FiSearch size={16} />
          </div>
          <input
            type='text'
            aria-label='Search orders by ID or product name'
            placeholder='Search by Order ID or item name...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='input-field pl-10 text-xs sm:text-sm'
          />
        </div>

        {/* Status Filter & Reset */}
        <div className='flex items-center gap-2.5 flex-wrap sm:flex-nowrap'>
          <div className='flex items-center gap-1.5 text-xs text-surface-muted font-medium shrink-0'>
            <FiFilter size={14} />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            aria-label='Filter orders by status'
            className='input-field py-2 text-xs sm:text-sm bg-white font-medium text-surface-title min-w-[140px]'
          >
            <option value=''>All Statuses</option>
            <option value='paid'>Paid</option>
            <option value='pending'>Pending</option>
            <option value='cancelled'>Cancelled</option>
            <option value='failed'>Failed</option>
          </select>

          {(statusFilter || searchQuery) && (
            <button
              type='button'
              onClick={handleClearFilters}
              className='text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-2 rounded-control transition-colors cursor-pointer shrink-0'
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className='bg-white rounded-card border border-surface-border shadow-card p-4 space-y-3'>
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className='animate-pulse flex items-center justify-between p-3 bg-surface-50 rounded-control gap-4'>
              <div className='space-y-2 flex-1'>
                <div className='h-4 bg-surface-100 rounded w-1/4' />
                <div className='h-3 bg-surface-100 rounded w-1/3' />
              </div>
              <div className='h-6 bg-surface-100 rounded-full w-20' />
              <div className='h-8 bg-surface-100 rounded-control w-24' />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        /* Empty State */
        <div className='bg-white rounded-card border border-surface-border shadow-card py-16 px-4'>
          <NoData
            title='No Orders Found'
            description={
              statusFilter || debouncedSearch
                ? 'No customer orders match the specified search query or status filter.'
                : 'There are currently no customer orders placed in the system.'
            }
          />
        </div>
      ) : (
        /* Orders Presentation */
        <div className='space-y-4'>
          {/* Desktop Table View */}
          <div className='hidden md:block bg-white rounded-card border border-surface-border shadow-card overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full text-left text-xs sm:text-sm text-surface-title'>
                <thead className='bg-surface-50 text-[11px] font-bold text-surface-muted uppercase tracking-wider border-b border-surface-border'>
                  <tr>
                    <th scope='col' className='px-4 py-3.5'>Order ID</th>
                    <th scope='col' className='px-4 py-3.5'>Customer</th>
                    <th scope='col' className='px-4 py-3.5'>Date</th>
                    <th scope='col' className='px-4 py-3.5'>Items</th>
                    <th scope='col' className='px-4 py-3.5'>Total</th>
                    <th scope='col' className='px-4 py-3.5'>Status</th>
                    <th scope='col' className='px-4 py-3.5 text-right'>Action</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-surface-border'>
                  {orders.map((order) => {
                    const custName = order?.userId?.name || 'Guest Customer'
                    const custEmail = order?.userId?.email || ''
                    const itemCount = order?.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 0

                    return (
                      <tr key={order._id} className='hover:bg-surface-50/80 transition-colors'>
                        {/* Order ID */}
                        <td className='px-4 py-3.5 font-semibold text-surface-title'>
                          <div className='flex items-center gap-1.5'>
                            <span className='font-mono text-xs text-surface-title'>{order.orderId}</span>
                            <button
                              type='button'
                              onClick={() => handleCopyOrderId(order.orderId)}
                              title='Copy Order ID'
                              className='text-surface-muted hover:text-surface-title p-0.5 rounded cursor-pointer'
                            >
                              <FiCopy size={12} />
                            </button>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className='px-4 py-3.5'>
                          <p className='font-semibold text-surface-title'>{custName}</p>
                          {custEmail && <p className='text-xs text-surface-muted truncate max-w-[180px]'>{custEmail}</p>}
                        </td>

                        {/* Date */}
                        <td className='px-4 py-3.5 text-xs text-surface-muted whitespace-nowrap'>
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>

                        {/* Items */}
                        <td className='px-4 py-3.5'>
                          <span className='inline-flex items-center gap-1 text-surface-title font-medium'>
                            <FiPackage size={14} className='text-surface-muted' />
                            <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                          </span>
                        </td>

                        {/* Total */}
                        <td className='px-4 py-3.5 font-bold text-surface-title whitespace-nowrap'>
                          {DisplayPriceInRupees(order.totalAmt)}
                        </td>

                        {/* Status */}
                        <td className='px-4 py-3.5'>
                          <StatusBadge status={order.payment_status} />
                        </td>

                        {/* Actions */}
                        <td className='px-4 py-3.5 text-right'>
                          <button
                            type='button'
                            onClick={() => setSelectedOrder(order)}
                            className='btn-secondary py-1.5 px-3 text-xs font-semibold inline-flex items-center gap-1.5'
                          >
                            <FiEye size={13} />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile / Tablet Stacked Card View */}
          <div className='md:hidden space-y-3'>
            {orders.map((order) => {
              const custName = order?.userId?.name || 'Guest Customer'
              const itemCount = order?.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 0

              return (
                <div
                  key={order._id}
                  className='bg-white rounded-card border border-surface-border shadow-card p-4 space-y-3'
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div>
                      <div className='flex items-center gap-1.5'>
                        <span className='font-mono font-bold text-xs text-surface-title'>#{order.orderId}</span>
                        <button
                          type='button'
                          onClick={() => handleCopyOrderId(order.orderId)}
                          aria-label='Copy Order ID'
                          className='text-surface-muted hover:text-surface-title p-0.5'
                        >
                          <FiCopy size={12} />
                        </button>
                      </div>
                      <p className='text-xs text-surface-muted mt-0.5'>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                    <StatusBadge status={order.payment_status} />
                  </div>

                  <div className='flex items-center justify-between text-xs text-surface-title pt-2 border-t border-surface-border'>
                    <span>Customer: <strong className='text-surface-title'>{custName}</strong></span>
                    <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                  </div>

                  <div className='flex items-center justify-between pt-2 border-t border-surface-border'>
                    <div>
                      <span className='text-[11px] text-surface-muted uppercase font-bold tracking-wider'>Total: </span>
                      <span className='text-sm font-extrabold text-brand-700'>
                        {DisplayPriceInRupees(order.totalAmt)}
                      </span>
                    </div>

                    <button
                      type='button'
                      onClick={() => setSelectedOrder(order)}
                      className='btn-primary py-1.5 px-3 text-xs font-semibold inline-flex items-center gap-1'
                    >
                      <FiEye size={13} />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className='bg-white rounded-card border border-surface-border shadow-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-surface-muted'>
              <span>
                Showing page <strong className='text-surface-title'>{page}</strong> of <strong className='text-surface-title'>{totalPages}</strong> ({totalCount} total orders)
              </span>

              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page <= 1}
                  className='btn-secondary py-1.5 px-3 text-xs font-semibold disabled:opacity-40 inline-flex items-center gap-1'
                >
                  <FiChevronLeft size={14} />
                  <span>Previous</span>
                </button>

                <button
                  type='button'
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page >= totalPages}
                  className='btn-secondary py-1.5 px-3 text-xs font-semibold disabled:opacity-40 inline-flex items-center gap-1'
                >
                  <span>Next</span>
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details & Status Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  )
}

export default AdminOrders
