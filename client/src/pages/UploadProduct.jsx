import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import toast from 'react-hot-toast'
import {
  FiPackage,
  FiUploadCloud,
  FiX,
  FiArrowLeft,
  FiCheck
} from 'react-icons/fi'

const UploadProduct = () => {
  const [loading, setLoading] = useState(false)
  const [categoryList, setCategoryList] = useState([])
  const [subCategoryList, setSubCategoryList] = useState([])
  const navigate = useNavigate()

  const [data, setData] = useState({
    name: '',
    image: [],
    category: '',
    subCategory: '',
    unit: '',
    stock: '',
    price: '',
    discount: '',
    description: '',
    more_details: {}
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    const base64Images = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = (err) => reject(err)
            reader.readAsDataURL(file)
          })
      )
    )

    setData((prev) => ({
      ...prev,
      image: [...prev.image, ...base64Images]
    }))

    e.target.value = ''
  }

  const handleRemoveImage = (idx) => {
    setData((prev) => ({
      ...prev,
      image: prev.image.filter((_, i) => i !== idx)
    }))
  }

  const fetchCategoryAndSubCategory = async () => {
    try {
      const [catRes, subCatRes] = await Promise.allSettled([
        Axios({ ...SummaryApi.getCategory }),
        Axios({ ...SummaryApi.getSubCategory, data: {} })
      ])

      if (catRes.status === 'fulfilled' && catRes.value.data.success) {
        setCategoryList(catRes.value.data.data || catRes.value.data.category || [])
      }
      if (subCatRes.status === 'fulfilled' && subCatRes.value.data.success) {
        setSubCategoryList(subCatRes.value.data.data || subCatRes.value.data.subcategory || [])
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  useEffect(() => {
    fetchCategoryAndSubCategory()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!data.name || !data.category || !data.subCategory) {
      toast.error('Please select both category and subcategory!')
      return
    }

    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.createProduct,
        data
      })
      const { data: resData } = response

      if (resData.success) {
        toast.success(resData.message || 'Product created successfully')
        setData({
          name: '',
          image: [],
          category: '',
          subCategory: '',
          unit: '',
          stock: '',
          price: '',
          discount: '',
          description: '',
          more_details: {}
        })
        navigate('/dashboard/product')
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='space-y-6 animate-fadeIn max-w-4xl'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <div className='flex items-center gap-2'>
            <Link
              to='/dashboard/product'
              className='p-1.5 text-surface-muted hover:text-surface-title hover:bg-surface-50 rounded-control transition-colors'
              title='Back to Products'
            >
              <FiArrowLeft size={18} />
            </Link>
            <h1 className='text-2xl font-bold text-surface-title tracking-tight'>
              Upload Product
            </h1>
          </div>
          <p className='text-sm text-surface-muted mt-1 pl-8'>
            Add a new product item to your grocery catalog
          </p>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Section 1: Basic Information */}
        <div className='bg-white rounded-card border border-surface-border shadow-card p-6 sm:p-7 space-y-4'>
          <div className='flex items-center gap-2 pb-3 border-b border-surface-border'>
            <FiPackage size={17} className='text-brand-600' />
            <h2 className='font-bold text-sm text-surface-title'>General Information</h2>
          </div>

          <div>
            <label
              htmlFor='product_name'
              className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'
            >
              Product Name *
            </label>
            <input
              type='text'
              id='product_name'
              name='name'
              placeholder='e.g. Fresh Organic Bananas'
              value={data.name}
              onChange={handleChange}
              required
              className='input-field'
            />
          </div>

          <div>
            <label
              htmlFor='product_desc'
              className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'
            >
              Description
            </label>
            <textarea
              id='product_desc'
              name='description'
              placeholder='Describe product features, origin, or dietary specifications...'
              value={data.description}
              onChange={handleChange}
              rows={3}
              className='input-field'
            />
          </div>
        </div>

        {/* Section 2: Categorization */}
        <div className='bg-white rounded-card border border-surface-border shadow-card p-6 sm:p-7 space-y-4'>
          <h2 className='font-bold text-sm text-surface-title pb-3 border-b border-surface-border'>
            Categorization
          </h2>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label
                htmlFor='product_category'
                className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'
              >
                Category *
              </label>
              <select
                id='product_category'
                name='category'
                value={data.category}
                onChange={handleChange}
                required
                className='input-field bg-white'
              >
                <option value=''>Select Parent Category</option>
                {categoryList.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor='product_subcategory'
                className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'
              >
                Subcategory *
              </label>
              <select
                id='product_subcategory'
                name='subCategory'
                value={data.subCategory}
                onChange={handleChange}
                required
                className='input-field bg-white'
              >
                <option value=''>Select Subcategory</option>
                {subCategoryList.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Pricing & Inventory */}
        <div className='bg-white rounded-card border border-surface-border shadow-card p-6 sm:p-7 space-y-4'>
          <h2 className='font-bold text-sm text-surface-title pb-3 border-b border-surface-border'>
            Pricing & Inventory
          </h2>

          <div className='grid grid-cols-1 sm:grid-cols-4 gap-4'>
            <div>
              <label
                htmlFor='product_unit'
                className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'
              >
                Unit / Size
              </label>
              <input
                type='text'
                id='product_unit'
                name='unit'
                placeholder='e.g. 500g / 1kg'
                value={data.unit}
                onChange={handleChange}
                className='input-field'
              />
            </div>

            <div>
              <label
                htmlFor='product_stock'
                className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'
              >
                Stock Units
              </label>
              <input
                type='number'
                id='product_stock'
                name='stock'
                placeholder='Available quantity'
                value={data.stock}
                onChange={handleChange}
                className='input-field'
              />
            </div>

            <div>
              <label
                htmlFor='product_price'
                className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'
              >
                Price (₹) *
              </label>
              <input
                type='number'
                id='product_price'
                name='price'
                placeholder='₹ Price'
                value={data.price}
                onChange={handleChange}
                required
                className='input-field'
              />
            </div>

            <div>
              <label
                htmlFor='product_discount'
                className='block text-xs font-semibold text-surface-title uppercase tracking-wider mb-1.5'
              >
                Discount (%)
              </label>
              <input
                type='number'
                id='product_discount'
                name='discount'
                placeholder='e.g. 10%'
                value={data.discount}
                onChange={handleChange}
                className='input-field'
              />
            </div>
          </div>
        </div>

        {/* Section 4: Product Images */}
        <div className='bg-white rounded-card border border-surface-border shadow-card p-6 sm:p-7 space-y-4'>
          <h2 className='font-bold text-sm text-surface-title pb-3 border-b border-surface-border'>
            Product Images
          </h2>

          <label
            htmlFor='upload_prod_images'
            className='flex flex-col items-center justify-center p-6 border-2 border-dashed border-surface-border hover:border-brand-500 rounded-card bg-surface-50 hover:bg-brand-50/40 cursor-pointer transition-colors text-center'
          >
            <FiUploadCloud size={28} className='text-surface-muted mb-2' />
            <span className='text-xs font-semibold text-surface-title'>
              Click or drag photos to upload
            </span>
            <span className='text-[11px] text-surface-muted mt-0.5'>
              PNG, JPG, WEBP formats accepted
            </span>
            <input
              type='file'
              id='upload_prod_images'
              multiple
              accept='image/*'
              onChange={handleImageUpload}
              className='hidden'
            />
          </label>

          {data.image.length > 0 && (
            <div className='flex flex-wrap gap-3 pt-2'>
              {data.image.map((img, idx) => (
                <div key={idx} className='relative w-24 h-24 rounded-control overflow-hidden border border-surface-border shadow-subtle group'>
                  <img
                    src={img}
                    alt={`Preview ${idx + 1}`}
                    className='w-full h-full object-contain bg-white p-1'
                  />
                  <button
                    type='button'
                    onClick={() => handleRemoveImage(idx)}
                    aria-label={`Remove image ${idx + 1}`}
                    className='absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors'
                  >
                    <FiX size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className='flex items-center justify-end gap-3 pt-2'>
          <Link
            to='/dashboard/product'
            className='btn-secondary py-2.5 px-5 text-sm font-semibold'
          >
            Cancel
          </Link>
          <button
            type='submit'
            disabled={loading}
            className='btn-primary py-2.5 px-6 text-sm font-semibold inline-flex items-center gap-2 shadow-subtle'
          >
            {loading ? (
              <span>Uploading SKU...</span>
            ) : (
              <>
                <FiCheck size={16} />
                <span>Upload Product</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default UploadProduct
