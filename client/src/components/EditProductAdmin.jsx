import React, { useEffect, useState, useCallback } from 'react'
import { IoClose } from 'react-icons/io5'
import uploadImage from '../utils/uploadImage'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { toast } from 'react-hot-toast'
import { FiUploadCloud, FiX, FiCheck } from 'react-icons/fi'

const EditProductAdmin = ({ close, productId, fetchData }) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])

  const [originalData, setOriginalData] = useState(null)
  const [data, setData] = useState({
    _id: '',
    name: '',
    category: '',
    subcategory: '',
    unit: '',
    price: '',
    discount: '',
    stock: '',
    description: '',
    images: []
  })

  /** Fetch categories & subcategories */
  const getCategoriesAndSubcategories = useCallback(async () => {
    try {
      const [catResp, subResp] = await Promise.all([
        Axios(SummaryApi.getCategory),
        Axios(SummaryApi.getSubCategory)
      ])

      if (catResp.data?.success) setCategories(catResp.data.data || [])
      if (subResp.data?.success) setSubcategories(subResp.data.data || [])
    } catch (err) {
      AxiosToastError(err)
    }
  }, [])

  /** Fetch product details */
  const fetchProductDetails = useCallback(async () => {
    if (!productId) return
    try {
      const resp = await Axios.get(`${SummaryApi.getProductDetails}/${productId}`)
      const p = resp.data?.data || {}

      const formatted = {
        _id: p._id || '',
        name: p.name || '',
        category: p.category?._id || p.category || '',
        subcategory: p.subCategory?._id || p.subCategory || '',
        unit: p.unit || '',
        price: p.price ?? '',
        discount: p.discount ?? '',
        stock: p.stock ?? '',
        description: p.description || '',
        images: Array.isArray(p.image) ? p.image : []
      }

      setData(formatted)
      setOriginalData(formatted)
    } catch (err) {
      AxiosToastError(err)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    getCategoriesAndSubcategories()
    fetchProductDetails()
  }, [getCategoriesAndSubcategories, fetchProductDetails])

  const handleOnChange = (e) => {
    const { name, value } = e.target
    setData((prev) => ({ ...prev, [name]: value }))

    if (name === 'category') {
      setData((prev) => ({ ...prev, subcategory: '' }))
    }
  }

  const handleUploadImages = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setSaving(true)
    try {
      const uploadedImages = [...(data.images || [])]
      for (let i = 0; i < files.length; i++) {
        const uploadResp = await uploadImage(files[i])
        const url =
          uploadResp?.data?.data?.url ||
          uploadResp?.data?.url ||
          uploadResp?.data ||
          null
        if (url) uploadedImages.push(url)
      }
      setData((prev) => ({ ...prev, images: uploadedImages }))
      toast.success('Image uploaded')
    } catch (err) {
      AxiosToastError(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteImage = (index) => {
    const copy = [...(data.images || [])]
    copy.splice(index, 1)
    setData((prev) => ({ ...prev, images: copy }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!data.name || !data.category || !data.subcategory) {
      toast.error('Please fill all required fields!')
      return
    }

    try {
      setSaving(true)
      const payload = {
        ...data,
        category: data.category,
        subCategory: data.subcategory,
        image: data.images
      }

      const resp = await Axios({
        ...SummaryApi.updateProduct,
        data: payload
      })

      if (resp.data?.success) {
        toast.success(resp.data.message || 'Product updated successfully')
        fetchData?.()
        close?.()
      } else {
        toast.error(resp.data?.message || 'Update failed')
      }
    } catch (err) {
      AxiosToastError(err)
    } finally {
      setSaving(false)
    }
  }

  const isChanged =
    originalData && JSON.stringify(originalData) !== JSON.stringify(data)

  if (loading) {
    return (
      <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4'>
        <div className='bg-white p-6 rounded-card shadow-modal border border-surface-border flex items-center gap-3'>
          <svg
            className='animate-spin h-5 w-5 text-brand-600'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            />
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            />
          </svg>
          <span className='text-sm font-semibold text-surface-title'>Loading SKU details...</span>
        </div>
      </div>
    )
  }

  return (
    <section
      role='dialog'
      aria-modal='true'
      aria-labelledby='edit-product-heading'
      onKeyDown={(e) => {
        if (e.key === 'Escape') close?.()
      }}
      className='fixed inset-0 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 overflow-y-auto animate-fadeIn'
      onClick={close}
    >
      <div
        className='bg-white w-full max-w-3xl p-6 sm:p-7 rounded-card shadow-modal border border-surface-border relative my-auto max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between pb-4 mb-4 border-b border-surface-border'>
          <div>
            <h2 id='edit-product-heading' className='text-lg font-bold text-surface-title'>
              Edit Product SKU
            </h2>
            <p className='text-xs text-surface-muted'>Update product details, pricing, and media</p>
          </div>
          <button
            type='button'
            onClick={close}
            aria-label='Close dialog'
            className='text-surface-muted hover:text-surface-title p-1.5 rounded-control hover:bg-surface-50 transition-colors cursor-pointer'
          >
            <IoClose size={22} />
          </button>
        </div>

        {/* Product Images Strip */}
        <div className='mb-5'>
          <label className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-2'>
            Product Media
          </label>
          <div className='flex gap-3 overflow-x-auto pb-2'>
            {(data.images || []).map((img, idx) => (
              <div
                key={idx}
                className='relative w-24 h-24 border border-surface-border rounded-control overflow-hidden shrink-0 bg-surface-50 p-1'
              >
                <img
                  src={img}
                  alt={`${data.name || 'Product'} preview ${idx + 1}`}
                  className='w-full h-full object-contain'
                />
                <button
                  type='button'
                  aria-label={`Delete image ${idx + 1}`}
                  className='absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white rounded-full p-1 transition-colors'
                  onClick={() => handleDeleteImage(idx)}
                >
                  <FiX size={12} />
                </button>
              </div>
            ))}
            <label
              tabIndex={0}
              role='button'
              aria-label='Add more images'
              className='w-24 h-24 border-2 border-dashed border-surface-border hover:border-brand-500 rounded-control flex flex-col items-center justify-center cursor-pointer bg-surface-50 hover:bg-brand-50/40 shrink-0 transition-colors'
            >
              <FiUploadCloud size={20} className='text-surface-muted mb-1' />
              <span className='text-[10px] font-semibold text-surface-title'>
                {saving ? 'Uploading...' : '+ Add'}
              </span>
              <input
                type='file'
                multiple
                className='hidden'
                onChange={handleUploadImages}
              />
            </label>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1'>
              Product Name *
            </label>
            <input
              name='name'
              value={data.name}
              onChange={handleOnChange}
              required
              className='input-field'
            />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1'>
                Category *
              </label>
              <select
                name='category'
                value={data.category}
                onChange={handleOnChange}
                required
                className='input-field bg-white'
              >
                <option value=''>Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1'>
                Subcategory *
              </label>
              <select
                name='subcategory'
                value={data.subcategory}
                onChange={handleOnChange}
                required
                className='input-field bg-white'
                disabled={!data.category}
              >
                <option value=''>Select Subcategory</option>
                {subcategories
                  .filter((s) => {
                    if (!data.category) return false
                    if (Array.isArray(s.category)) {
                      return s.category.some(
                        (c) => (c?._id || c) === data.category
                      )
                    }
                    return s.category === data.category
                  })
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <div>
              <label className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1'>
                Unit / Size
              </label>
              <input
                name='unit'
                value={data.unit}
                onChange={handleOnChange}
                className='input-field'
              />
            </div>

            <div>
              <label className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1'>
                Price (₹) *
              </label>
              <input
                name='price'
                type='number'
                value={data.price}
                onChange={handleOnChange}
                required
                className='input-field'
              />
            </div>

            <div>
              <label className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1'>
                Stock
              </label>
              <input
                name='stock'
                type='number'
                value={data.stock}
                onChange={handleOnChange}
                className='input-field'
              />
            </div>
          </div>

          <div>
            <label className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1'>
              Discount (%)
            </label>
            <input
              name='discount'
              type='number'
              value={data.discount}
              onChange={handleOnChange}
              className='input-field'
            />
          </div>

          <div>
            <label className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1'>
              Description
            </label>
            <textarea
              name='description'
              rows={3}
              value={data.description}
              onChange={handleOnChange}
              className='input-field'
            />
          </div>

          {/* Action Buttons */}
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
              disabled={saving || !isChanged}
              className='btn-primary py-2 px-5 text-xs font-semibold inline-flex items-center gap-2'
            >
              {saving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <FiCheck size={15} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default EditProductAdmin
