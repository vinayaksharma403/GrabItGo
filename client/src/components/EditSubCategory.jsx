import React, { useState, useRef, useEffect } from 'react'
import { IoClose, IoChevronDown } from 'react-icons/io5'
import { useSelector } from 'react-redux'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import { FiUploadCloud, FiX, FiCheck } from 'react-icons/fi'

const EditSubCategory = ({ close, onSuccess, data }) => {
  const [subCategoryData, setSubCategoryData] = useState({
    _id: data._id,
    name: data.name,
    image: data.image,
    category: data.category || []
  })

  const [loading, setLoading] = useState(false)
  const allCategory = useSelector((state) => state.product.allCategory)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const toggleDropdown = () => setDropdownOpen((prev) => !prev)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCategoryToggle = (catObj) => {
    setSubCategoryData((prev) => {
      const exists = prev.category.some((c) => c._id === catObj._id)
      const updatedCategories = exists
        ? prev.category.filter((c) => c._id !== catObj._id)
        : [...prev.category, catObj]
      return { ...prev, category: updatedCategories }
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setSubCategoryData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSubCategoryData((prev) => ({ ...prev, image: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageRemove = () => {
    setSubCategoryData((prev) => ({ ...prev, image: '' }))
  }

  const handleSubmitSubCategory = async (e) => {
    e.preventDefault()
    if (!subCategoryData.name || !subCategoryData.category.length) {
      toast.error('Please provide name and select at least one parent category!')
      return
    }

    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.updateSubCategory,
        data: subCategoryData
      })

      const { data: responseData } = response
      if (responseData.success) {
        toast.success(responseData.message || 'Subcategory updated successfully')
        if (onSuccess) onSuccess()
        if (close) close()
      } else {
        toast.error(responseData.message || 'Failed to update subcategory')
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
      aria-labelledby='edit-subcategory-title'
      onKeyDown={(e) => {
        if (e.key === 'Escape') close?.()
      }}
      className='fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 overflow-y-auto animate-fadeIn'
      onClick={close}
    >
      <div
        className='w-full max-w-md bg-white rounded-card shadow-modal border border-surface-border p-6 relative my-auto max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between pb-3 mb-4 border-b border-surface-border'>
          <h2 id='edit-subcategory-title' className='text-base font-bold text-surface-title'>
            Edit Subcategory
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
        <form className='space-y-4' onSubmit={handleSubmitSubCategory}>
          <div>
            <label htmlFor='editSubCatName' className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'>
              Subcategory Name *
            </label>
            <input
              id='editSubCatName'
              name='name'
              value={subCategoryData.name}
              onChange={handleChange}
              type='text'
              required
              placeholder='Enter subcategory name'
              className='input-field'
            />
          </div>

          <div>
            <label className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'>
              Subcategory Image
            </label>
            <label
              htmlFor='uploadEditSubCategoryImage'
              className='cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-surface-border hover:border-brand-500 rounded-card py-5 bg-surface-50 hover:bg-brand-50/40 transition-colors'
            >
              {!subCategoryData.image ? (
                <div className='flex flex-col items-center gap-1.5 text-center'>
                  <FiUploadCloud size={22} className='text-surface-muted' />
                  <span className='text-xs font-semibold text-surface-title'>Click to choose image</span>
                  <input
                    type='file'
                    id='uploadEditSubCategoryImage'
                    accept='image/*'
                    className='hidden'
                    onChange={handleImageChange}
                  />
                </div>
              ) : (
                <div className='relative w-28 h-28 p-1'>
                  <img
                    src={subCategoryData.image}
                    alt='Preview'
                    className='w-full h-full object-contain rounded-control'
                  />
                  <button
                    type='button'
                    onClick={(e) => {
                      e.preventDefault()
                      handleImageRemove()
                    }}
                    aria-label='Remove image'
                    className='absolute -top-1 -right-1 bg-black/70 hover:bg-rose-600 text-white rounded-full p-1 transition-colors'
                  >
                    <FiX size={12} />
                  </button>
                </div>
              )}
            </label>
          </div>

          {/* Category Dropdown */}
          <div className='relative' ref={dropdownRef}>
            <label className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'>
              Parent Categories *
            </label>
            <div
              role='button'
              tabIndex={0}
              aria-haspopup='listbox'
              aria-expanded={dropdownOpen}
              onClick={toggleDropdown}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleDropdown()
                }
              }}
              className='flex justify-between items-center input-field bg-white cursor-pointer select-none'
            >
              <span className='text-surface-title text-xs truncate'>
                {subCategoryData.category.length > 0
                  ? subCategoryData.category.map((c) => c.name).join(', ')
                  : 'Select parent category'}
              </span>
              <IoChevronDown className={`transition-transform duration-200 text-surface-muted ${dropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {dropdownOpen && (
              <div className='absolute top-full left-0 right-0 bg-white border border-surface-border rounded-card shadow-modal mt-1 z-50 max-h-48 overflow-y-auto p-1 animate-fadeIn divide-y divide-surface-border'>
                {allCategory && allCategory.length > 0 ? (
                  allCategory.map((cat) => (
                    <label
                      key={cat._id}
                      className='flex items-center gap-2.5 px-3 py-2 hover:bg-surface-50 rounded-control cursor-pointer transition-colors'
                    >
                      <input
                        type='checkbox'
                        checked={subCategoryData.category.some((c) => c._id === cat._id)}
                        onChange={() => handleCategoryToggle(cat)}
                        className='accent-brand-600 rounded'
                      />
                      <span className='text-surface-title text-xs font-medium'>{cat.name}</span>
                    </label>
                  ))
                ) : (
                  <p className='text-surface-muted text-xs px-3 py-2'>No categories available</p>
                )}
              </div>
            )}
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
              disabled={loading || !subCategoryData.name || !subCategoryData.category.length}
              className='btn-primary py-2 px-5 text-xs font-semibold inline-flex items-center gap-2'
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <FiCheck size={15} />
                  <span>Update Subcategory</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default EditSubCategory
