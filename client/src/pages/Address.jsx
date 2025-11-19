import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { MdEdit, MdDelete } from "react-icons/md";
import { FaPlus } from "react-icons/fa";
import AddAddress from '../components/AddAddress';
import SummaryApi from '../common/SummaryApi';
import Axios from '../utils/Axios';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';
import { useGlobalContext } from '../provider/GlobalProvider';
import noDataImage from '../assets/Nothing here yet.png'

const Address = () => {
  const addressList = useSelector(state => state.addresses.addressList)
  const [openAddress, setOpenAddress] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(null)

  const handleDisableAddress = async (addressId) => {
    try {
      const response = await Axios({
        ...SummaryApi.disableAddress,
        data: {
          _id: addressId
        }
      })
      if (response.data.success) {
        toast.success("Address removed")
        fetchAddress()
      }
    } catch (error) {
      AxiosToastError(error)
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
    <div className='bg-blue-50 min-h-[77vh]'>
      <div className='container mx-auto p-4'>
        <div className='bg-white shadow-lg rounded-lg p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-semibold text-gray-800'>Your Addresses</h2>
            <button
              onClick={handleAddAddress}
              className='flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors'
            >
              <FaPlus size={16} />
              Add Address
            </button>
          </div>

          {addressList.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <img
                src={noDataImage}
                alt="No addresses"
                className='w-48 h-48 object-contain mb-4'
              />
              <p className='text-gray-500 text-lg'>No addresses added yet</p>
              <p className='text-gray-400 text-sm'>Add your first address to get started</p>
            </div>
          ) : (
            <div className='grid gap-4'>
              {addressList.map((address) => (
                <div
                  key={address._id}
                  className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                >
                  <div className='flex justify-between items-start'>
                    <div className='flex-1'>
                      <p className='font-medium text-gray-800'>{address.address_line}</p>
                      <p className='text-gray-600 text-sm'>
                        {address.city}, {address.state} - {address.pincode}
                      </p>
                      <p className='text-gray-600 text-sm'>{address.country}</p>
                      <p className='text-gray-600 text-sm'>Mobile: {address.mobile}</p>
                    </div>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => handleEditAddress(address)}
                        className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                        title="Edit address"
                      >
                        <MdEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDisableAddress(address._id)}
                        className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                        title="Delete address"
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {openAddress && (
        <AddAddress
          close={() => setOpenAddress(false)}
          selectedAddress={selectedAddress}
        />
      )}
    </div>
  )
}

export default Address
