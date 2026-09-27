import React, { useState } from 'react'
import { IoClose } from 'react-icons/io5'
import uploadImage from '../utils/uploadImage'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { toast } from 'react-hot-toast'
import { FiUploadCloud, FiCheck } from 'react-icons/fi'

const EditCategory = ({ close, fetchData, data: CategoryData }) => {
  const [data, setData] = useState({
    _id: CategoryData?._id || '',
    name: CategoryData?.name || '',
    image: CategoryData?.image || ''
  })

  const [loading, setLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)

  const handleOnChange = (e) => {
    const { name, value } = e.target
    setData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!data.name || !data.image) {
      toast.error('Please provide category name and image!')
      return
    }

    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.updateCategory,
        data: data
      })
      const { data: responseData } = response

      if (responseData.success) {
        toast.success(responseData.message || 'Category updated successfully')
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
      setData((prev) => ({
        ...prev,
        image: ImageResponse.data.url
      }))
      toast.success('Image updated successfully')
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
      aria-labelledby='edit-category-title'
      onKeyDown={(e) => {
        if (e.key === 'Escape') close?.()
      }}
      className='fixed inset-0 p-3 sm:p-4 bg-surface-title/60 backdrop-blur-xs z-50 flex items-center justify-center overflow-y-auto animate-fadeIn'
      onClick={close}
    >
      <div
        className='bg-white max-w-md w-full p-5 sm:p-6 rounded-card shadow-modal border border-surface-border my-auto max-h-[92vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between pb-3 mb-4 border-b border-surface-border'>
          <h2 id='edit-category-title' className='text-base font-bold text-surface-title'>
            Update Category
          </h2>
          <button
            type='button'
            onClick={close}
            aria-label='Close dialog'
            className='text-surface-muted hover:text-surface-title p-1.5 rounded-control hover:bg-surface-50 transition-colors cursor-pointer'
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Form */}
        <form className='space-y-4' onSubmit={handleSubmit}>
          <div>
            <label htmlFor='editCategoryName' className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'>
              Category Name *
            </label>
            <input
              type='text'
              id='editCategoryName'
              placeholder='Enter category name'
              value={data.name}
              name='name'
              onChange={handleOnChange}
              required
              className='input-field'
            />
          </div>

          <div>
            <label className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'>
              Category Icon / Image *
            </label>
            <div className='flex items-center gap-4'>
              <div className='border-2 border-dashed border-surface-border bg-surface-50 h-24 w-24 flex items-center justify-center rounded-xl overflow-hidden shrink-0 p-1'>
                {data.image ? (
                  <img
                    alt={data.name || 'Category'}
                    src={data.image}
                    className='w-full h-full object-contain'
                  />
                ) : (
                  <span className='text-[10px] text-surface-muted'>No Image</span>
                )}
              </div>

              <label htmlFor='uploadEditCategoryImage' className='flex-1'>
                <div
                  className={`py-2.5 px-3 text-xs font-semibold rounded-control border border-dashed text-center transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                    imageUploading
                      ? 'bg-surface-100 text-surface-muted border-surface-border'
                      : 'border-brand-300 hover:border-brand-500 bg-brand-50/50 hover:bg-brand-50 text-brand-700'
                  }`}
                >
                  <FiUploadCloud size={16} />
                  <span>{imageUploading ? 'Uploading...' : 'Change Image'}</span>
                </div>
                <input
                  onChange={handleUploadCategoryImage}
                  type='file'
                  id='uploadEditCategoryImage'
                  accept='image/*'
                  className='hidden'
                />
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center justify-end gap-3 pt-3 border-t border-surface-border'>
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
              className='btn-primary py-2 px-5 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50'
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <FiCheck size={15} />
                  <span>Update Category</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default EditCategory
