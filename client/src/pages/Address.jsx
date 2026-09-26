import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { FiMapPin, FiPlus, FiEdit2, FiTrash2, FiPhone } from 'react-icons/fi'
import AddAddress from '../components/AddAddress'
import ConfirmBox from '../components/ConfirmBox'
import NoData from '../components/NoData'
import SummaryApi from '../common/SummaryApi'
import Axios from '../utils/axios'
import AxiosToastError from '../utils/AxiosToastError'
import toast from 'react-hot-toast'
import { useGlobalContext } from '../provider/GlobalContext'

const Address = () => {
  const addressList = useSelector((state) => state.addresses.addressList) || []
  const [openAddress, setOpenAddress] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [deleteAddressId, setDeleteAddressId] = useState(null)
  const { fetchAddress } = useGlobalContext()

  useEffect(() => {
    fetchAddress()
  }, [fetchAddress])

  const handleConfirmDelete = async () => {
    if (!deleteAddressId) return
    try {
      const response = await Axios({
        ...SummaryApi.deleteAddress,
        data: {
          _id: deleteAddressId
        }
      })
      if (response.data.success) {
        toast.success(response.data.message || 'Address removed successfully')
        fetchAddress()
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setDeleteAddressId(null)
    }
  }

  const handleEditAddress = (address) => {
    setSelectedAddress(address)
    setOpenAddress(true)
  }

  const handleAddAddress = () => {
    setSelectedAddress(null)
    setOpenAddress(true)
  }

  return (
    <div className='space-y-6 animate-fadeIn'>
      {/* Page Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-slate-900 tracking-tight'>
            Saved Addresses
          </h1>
          <p className='text-sm text-slate-500 mt-1'>
            Manage your delivery locations for fast 10-minute drop-offs
          </p>
        </div>
        <button
          type='button'
          onClick={handleAddAddress}
          className='btn-primary inline-flex items-center gap-2 self-start sm:self-auto font-semibold text-sm shadow-subtle'
        >
          <FiPlus size={16} />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Address List or Empty State */}
      {addressList.length === 0 ? (
        <div className='bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 sm:p-12'>
          <NoData
            icon={FiMapPin}
            title='No Saved Addresses'
            description='You have not added any delivery addresses yet. Add an address to enable fast, seamless checkout.'
            actionText='Add Your First Address'
            onAction={handleAddAddress}
          />
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5'>
          {addressList.map((address, index) => (
            <div
              key={address._id || index}
              className='bg-white rounded-2xl border border-slate-200/80 shadow-card hover:border-slate-300 transition-all p-5 flex flex-col justify-between group'
            >
              <div>
                <div className='flex items-center justify-between mb-3'>
                  <div className='inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full'>
                    <FiMapPin size={13} />
                    <span>Address #{index + 1}</span>
                  </div>
                  <div className='flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity'>
                    <button
                      type='button'
                      onClick={() => handleEditAddress(address)}
                      aria-label={`Edit address at ${address.city}`}
                      className='p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer'
                      title='Edit Address'
                    >
                      <FiEdit2 size={15} />
                    </button>
                    <button
                      type='button'
                      onClick={() => setDeleteAddressId(address._id)}
                      aria-label={`Delete address at ${address.city}`}
                      className='p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer'
                      title='Delete Address'
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3 className='font-bold text-slate-900 text-sm leading-snug mb-1'>
                  {address.address_line}
                </h3>
                <p className='text-xs text-slate-600 leading-relaxed'>
                  {address.city}, {address.state} —{' '}
                  <span className='font-semibold'>{address.pincode}</span>
                </p>
                <p className='text-xs text-slate-500 mt-0.5'>{address.country}</p>
              </div>

              <div className='pt-4 mt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600 font-medium'>
                <FiPhone size={13} className='text-slate-400' />
                <span>Mobile: {address.mobile}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Dialog */}
      {openAddress && (
        <AddAddress
          close={() => setOpenAddress(false)}
          selectedAddress={selectedAddress}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteAddressId && (
        <ConfirmBox
          cancel={() => setDeleteAddressId(null)}
          confirm={handleConfirmDelete}
          close={() => setDeleteAddressId(null)}
        />
      )}
    </div>
  )
}

export default Address
