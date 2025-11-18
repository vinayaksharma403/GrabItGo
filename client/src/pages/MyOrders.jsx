import React, { useEffect, useState } from 'react'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import Loading from '../components/Loading'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'

const MyOrders = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.getOrders
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

  useEffect(() => {
    fetchOrders()
  }, [])

  return (
    <div className='container mx-auto px-4 py-4'>
      <div className='text-center py-4'>
        <h2 className='font-semibold text-2xl'>My Orders</h2>
      </div>

      {loading ? (
        <Loading />
      ) : data.length === 0 ? (
        <div className='text-center py-8'>
          <p className='text-gray-500'>No orders found</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {data.map((order) => (
            <div key={order._id} className='bg-white p-4 rounded-lg shadow'>
              <div className='flex justify-between items-start mb-4'>
                <div>
                  <h3 className='font-medium'>Order #{order.orderId}</h3>
                  <p className='text-sm text-gray-500'>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-sm ${
                  order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                  order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.payment_status}
                </div>
              </div>

              <div className='flex gap-4 mb-4'>
                <img
                  src={order.product_details?.image?.[0]}
                  alt={order.product_details?.name}
                  className='w-16 h-16 object-cover rounded'
                />
                <div className='flex-1'>
                  <h4 className='font-medium'>{order.product_details?.name}</h4>
                  <p className='text-sm text-gray-500'>
                    Quantity: {order.product_details?.quantity}
                  </p>
                  <p className='font-semibold'>
                    {DisplayPriceInRupees(order.product_details?.price)}
                  </p>
                </div>
              </div>

              <div className='border-t pt-4'>
                <div className='flex justify-between text-sm'>
                  <span>Subtotal:</span>
                  <span>{DisplayPriceInRupees(order.subTotalAmt)}</span>
                </div>
                <div className='flex justify-between font-semibold'>
                  <span>Total:</span>
                  <span>{DisplayPriceInRupees(order.totalAmt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyOrders
