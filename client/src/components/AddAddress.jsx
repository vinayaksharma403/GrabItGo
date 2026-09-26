import React, { useState } from 'react'
import { IoClose } from 'react-icons/io5'
import { FiMapPin, FiPhone, FiCheck } from 'react-icons/fi'
import SummaryApi from '../common/SummaryApi'
import Axios from '../utils/axios'
import AxiosToastError from '../utils/AxiosToastError'
import toast from 'react-hot-toast'
import { useGlobalContext } from '../provider/GlobalContext'

const AddAddress = ({ close, selectedAddress }) => {
  const [data, setData] = useState({
    address_line: selectedAddress?.address_line || '',
    city: selectedAddress?.city || '',
    state: selectedAddress?.state || '',
    pincode: selectedAddress?.pincode || '',
    country: selectedAddress?.country || 'India',
    mobile: selectedAddress?.mobile || ''
  })
  const [loading, setLoading] = useState(false)
  const { fetchAddress } = useGlobalContext()

  const handleOnChange = (e) => {
    const { name, value } = e.target
    setData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      let response
      if (selectedAddress) {
        response = await Axios({
          ...SummaryApi.updateAddress,
          data: {
            ...data,
            _id: selectedAddress._id
          }
        })
      } else {
        response = await Axios({
          ...SummaryApi.addAddress,
          data: data
        })
      }

      if (response.data.success) {
        toast.success(response.data.message)
        fetchAddress()
        close()
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-labelledby='address-dialog-title'
      onKeyDown={(e) => {
        if (e.key === 'Escape') close?.()
      }}
      className='fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn'
      onClick={() => close?.()}
    >
      <div
        className='bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200/80 my-auto max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className='flex items-center justify-between p-5 border-b border-slate-100'>
          <div className='flex items-center gap-2.5'>
            <div className='w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-subtle'>
              <FiMapPin size={18} />
            </div>
            <div>
              <h2 id='address-dialog-title' className='text-base font-bold text-slate-900'>
                {selectedAddress ? 'Edit Delivery Address' : 'Add New Address'}
              </h2>
              <p className='text-xs text-slate-500'>
                {selectedAddress ? 'Update address details below' : 'Where should we deliver your orders?'}
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={close}
            aria-label='Close dialog'
            className='p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700 cursor-pointer'
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className='p-5 space-y-4'>
          {/* Address Line */}
          <div>
            <label
              htmlFor='address_line'
              className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5'
            >
              Flat, House No., Building, Street / Area
            </label>
            <input
              type='text'
              id='address_line'
              name='address_line'
              value={data.address_line}
              onChange={handleOnChange}
              placeholder='e.g. 402, Green Valley Apartments, MG Road'
              className='input-field'
              required
            />
          </div>

          {/* City and State */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
            <div>
              <label
                htmlFor='address_city'
                className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5'
              >
                City / District
              </label>
              <input
                type='text'
                id='address_city'
                name='city'
                value={data.city}
                onChange={handleOnChange}
                placeholder='e.g. Bengaluru'
                className='input-field'
                required
              />
            </div>
            <div>
              <label
                htmlFor='address_state'
                className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5'
              >
                State
              </label>
              <input
                type='text'
                id='address_state'
                name='state'
                value={data.state}
                onChange={handleOnChange}
                placeholder='e.g. Karnataka'
                className='input-field'
                required
              />
            </div>
          </div>

          {/* Pincode and Country */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
            <div>
              <label
                htmlFor='address_pincode'
                className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5'
              >
                Pincode / Postal Code
              </label>
              <input
                type='text'
                id='address_pincode'
                name='pincode'
                value={data.pincode}
                onChange={handleOnChange}
                placeholder='e.g. 560001'
                className='input-field'
                required
              />
            </div>
            <div>
              <label
                htmlFor='address_country'
                className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5'
              >
                Country
              </label>
              <input
                type='text'
                id='address_country'
                name='country'
                value={data.country}
                onChange={handleOnChange}
                placeholder='India'
                className='input-field'
                required
              />
            </div>
          </div>

          {/* Contact Mobile */}
          <div>
            <label
              htmlFor='address_mobile'
              className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5'
            >
              Contact Mobile Number
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                <FiPhone size={15} />
              </div>
              <input
                type='tel'
                id='address_mobile'
                name='mobile'
                value={data.mobile}
                onChange={handleOnChange}
                placeholder='10-digit mobile number'
                className='input-field pl-10'
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center justify-end gap-3 pt-4 border-t border-slate-100'>
            <button
              type='button'
              onClick={close}
              className='btn-secondary py-2.5 px-4 text-xs font-semibold'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='btn-primary py-2.5 px-5 text-xs font-semibold inline-flex items-center gap-2'
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <FiCheck size={15} />
                  <span>{selectedAddress ? 'Update Address' : 'Save Address'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddAddress
