import React, { useState } from 'react'
import { FaCircleUser } from 'react-icons/fa6'
import { useDispatch, useSelector } from 'react-redux'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { updateAvatar } from '../store/userSlice'
import { IoClose } from 'react-icons/io5'
import { FiUploadCloud } from 'react-icons/fi'
import toast from 'react-hot-toast'

const UserProfileAvatarEdit = ({ close }) => {
  const user = useSelector((state) => state.user)
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadAvatarImage = async (e) => {
    e.preventDefault()
    if (!selectedFile || loading) return

    const formData = new FormData()
    formData.append('avatar', selectedFile)

    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.uploadAvatar,
        data: formData
      })
      const { data: responseData } = response
      if (responseData.success) {
        dispatch(updateAvatar(responseData.data.avatar))
        toast.success(responseData.message || 'Avatar updated successfully')
        close?.()
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      role='dialog'
      aria-modal='true'
      aria-labelledby='avatar-edit-title'
      onKeyDown={(e) => {
        if (e.key === 'Escape') close?.()
      }}
      className='fixed inset-0 bg-slate-900/60 backdrop-blur-xs p-4 flex items-center justify-center z-50'
    >
      <div
        className='bg-white max-w-sm w-full rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center animate-fadeIn'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex justify-between items-center w-full mb-4 pb-2 border-b border-slate-100'>
          <h2 id='avatar-edit-title' className='font-bold text-slate-800 text-base'>
            Update Profile Photo
          </h2>
          <button
            type='button'
            onClick={close}
            aria-label='Close dialog'
            className='text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-100'
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Avatar Preview */}
        <div className='w-24 h-24 flex items-center justify-center rounded-full overflow-hidden ring-4 ring-emerald-500/10 shadow-md bg-slate-100 my-2'>
          {preview ? (
            <img
              alt='Selected avatar preview'
              src={preview}
              className='w-full h-full object-cover'
            />
          ) : user.avatar ? (
            <img
              alt={user.name ? `${user.name}'s avatar` : 'Profile avatar'}
              src={user.avatar}
              className='w-full h-full object-cover'
            />
          ) : (
            <FaCircleUser size={72} className='text-slate-300' />
          )}
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUploadAvatarImage} className='w-full mt-4 space-y-3'>
          <label
            htmlFor='uploadProfile'
            className='w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors'
          >
            <FiUploadCloud size={16} className='text-slate-500' />
            <span>{selectedFile ? selectedFile.name : 'Choose image file'}</span>
            <input
              onChange={handleFileChange}
              type='file'
              id='uploadProfile'
              accept='image/*'
              className='hidden'
            />
          </label>

          <div className='flex gap-2 pt-2'>
            <button
              type='button'
              onClick={close}
              className='btn-secondary flex-1 py-2 text-xs font-semibold'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={!selectedFile || loading}
              className='btn-primary flex-1 py-2 text-xs font-semibold'
            >
              {loading ? 'Uploading...' : 'Save Photo'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default UserProfileAvatarEdit
