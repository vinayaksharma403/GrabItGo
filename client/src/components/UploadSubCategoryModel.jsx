import React, { useState, useRef, useEffect } from 'react'
import { IoClose, IoChevronDown } from 'react-icons/io5'
import { useSelector } from 'react-redux'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import { FiUploadCloud, FiX, FiCheck } from 'react-icons/fi'

const UploadSubCategoryModel = ({ close, onSuccess }) => {
  const [subCategoryData, setSubCategoryData] = useState({
    name: '',
    image: '',
    category: []
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
        ...SummaryApi.createSubCategory,
        data: subCategoryData
      })

      const { data: responseData } = response
      if (responseData.success) {
        toast.success(responseData.message || 'Subcategory created successfully')
        if (onSuccess) onSuccess()
        if (close) close()
      } else {
        toast.error(responseData.message || 'Failed to add subcategory')
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
      aria-labelledby='add-subcategory-title'
      onKeyDown={(e) => {
        if (e.key === 'Escape') close?.()
      }}
      className='fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 overflow-y-auto animate-fadeIn'
      onClick={close}
    >
      <div
        className='w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 relative my-auto max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between pb-3 mb-4 border-b border-slate-100'>
          <h2 id='add-subcategory-title' className='text-base font-bold text-slate-900'>
            Add Subcategory
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
        <form className='space-y-4' onSubmit={handleSubmitSubCategory}>
          {/* Name Input */}
          <div>
            <label htmlFor='name' className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5'>
              Subcategory Name *
            </label>
            <input
              id='name'
              name='name'
              value={subCategoryData.name}
              onChange={handleChange}
              type='text'
              required
              placeholder='e.g. Milk & Butter'
              className='input-field'
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5'>
              Subcategory Image
            </label>
            <label
              htmlFor='uploadImage'
              className='cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl py-5 bg-slate-50 hover:bg-emerald-50/40 transition-colors'
            >
              {!subCategoryData.image ? (
                <div className='flex flex-col items-center gap-1.5 text-center'>
                  <FiUploadCloud size={22} className='text-slate-400' />
                  <span className='text-xs font-semibold text-slate-600'>Click to choose image</span>
                  <span className='text-[10px] text-slate-400'>PNG, JPG formats supported</span>
                  <input
                    type='file'
                    id='uploadImage'
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
                    className='w-full h-full object-contain rounded-lg'
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

          {/* Multi-Select Dropdown */}
          <div className='relative' ref={dropdownRef}>
            <label className='block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5'>
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
              <span className='text-slate-700 text-xs truncate'>
                {subCategoryData.category.length > 0
                  ? subCategoryData.category.map((c) => c.name).join(', ')
                  : 'Select parent category'}
              </span>
              <IoChevronDown className={`transition-transform duration-200 text-slate-400 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {dropdownOpen && (
              <div className='absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 z-50 max-h-48 overflow-y-auto p-1 animate-fadeIn divide-y divide-slate-50'>
                {allCategory && allCategory.length > 0 ? (
                  allCategory.map((cat) => (
                    <label
                      key={cat._id}
                      className='flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors'
                    >
                      <input
                        type='checkbox'
                        checked={subCategoryData.category.some((c) => c._id === cat._id)}
                        onChange={() => handleCategoryToggle(cat)}
                        className='accent-emerald-600 rounded'
                      />
                      <span className='text-slate-800 text-xs font-medium'>{cat.name}</span>
                    </label>
                  ))
                ) : (
                  <p className='text-slate-400 text-xs px-3 py-2'>No categories available</p>
                )}
              </div>
            )}
          </div>

          {/* Buttons */}
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
              disabled={loading || !subCategoryData.name || !subCategoryData.category.length}
              className='btn-primary py-2 px-5 text-xs font-semibold inline-flex items-center gap-2'
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <FiCheck size={15} />
                  <span>Add Subcategory</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default UploadSubCategoryModel
