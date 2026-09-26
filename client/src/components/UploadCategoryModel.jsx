import React, { useState } from 'react'
import { IoClose } from 'react-icons/io5'
import uploadImage from '../utils/uploadImage'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { toast } from 'react-hot-toast'
import { FiUploadCloud, FiCheck } from 'react-icons/fi'

const UploadCategoryModel = ({ close, fetchData }) => {
  const [data, setData] = useState({ name: '', image: '' })
  const [loading, setLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)

  const handleOnChange = (e) => {
    const { name, value } = e.target
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!data.name || !data.image) {
      toast.error('Please provide category name and image!')
      return
    }

    try {
      setLoading(true)
      const response = await Axios({ ...SummaryApi.addCategory, data })
      const { data: responseData } = response

      if (responseData.success) {
        toast.success(responseData.message || 'Category added successfully')
        close()
        fetchData()
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadCategoryImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setImageUploading(true)
      const response = await uploadImage(file)
      const { data: ImageResponse } = response
      setData((prev) => ({ ...prev, image: ImageResponse.data.url }))
      toast.success('Image uploaded successfully')
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setImageUploading(false)
    }
  }

  return (
    <section
      role='dialog'
      aria-modal='true'
      aria-labelledby='add-category-title'
      onKeyDown={(e) => {
        if (e.key === 'Escape') close?.()
      }}
      className='fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn'
      onClick={close}
    >
      <div
        className='bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200/80 p-6 relative my-auto max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between pb-3 mb-4 border-b border-slate-100'>
          <h2 id='add-category-title' className='text-base font-bold text-slate-900'>
            Add Category
          </h2>
          <button
            type='button'
            onClick={close}
            aria-label='Close dialog'
            className='text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer'
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Form */}
        <form className='space-y-4' onSubmit={handleSubmit}>
          {/* Category Name */}
          <div>
            <label
              htmlFor='categoryName'
              className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5'
            >
              Category Name *
            </label>
            <input
              id='categoryName'
              name='name'
              value={data.name}
              onChange={handleOnChange}
              placeholder='e.g. Dairy & Eggs'
              type='text'
              required
              className='input-field'
            />
          </div>

          {/* Category Image */}
          <div>
            <label className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5'>
              Category Icon / Image *
            </label>
            <div className='flex items-center gap-4'>
              {/* Preview */}
              <div className='h-24 w-24 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden shrink-0 p-1'>
                {data.image ? (
                  <img
                    src={data.image}
                    alt='Category preview'
                    className='w-full h-full object-contain'
                  />
                ) : (
                  <span className='text-[10px] text-slate-400 text-center font-medium'>
                    No Image
                  </span>
                )}
              </div>

              {/* Upload Button */}
              <label htmlFor='uploadCategoryImage' className='flex-1'>
                <div
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border border-dashed text-center transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                    imageUploading
                      ? 'bg-slate-100 text-slate-400 border-slate-300'
                      : 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <FiUploadCloud size={16} />
                  <span>{imageUploading ? 'Uploading...' : 'Choose Image'}</span>
                </div>
                <input
                  type='file'
                  id='uploadCategoryImage'
                  accept='image/*'
                  onChange={handleUploadCategoryImage}
                  className='hidden'
                />
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center justify-end gap-3 pt-3 border-t border-slate-100'>
            <button
              type='button'
              onClick={close}
              className='btn-secondary py-2 px-4 text-xs font-semibold'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading || !data.name || !data.image}
              className='btn-primary py-2 px-5 text-xs font-semibold inline-flex items-center gap-2'
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <FiCheck size={15} />
                  <span>Create Category</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default UploadCategoryModel
