import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/axios'
import ProductCardAdmin from '../components/ProductCardAdmin'
import NoData from '../components/NoData'
import { FiSearch, FiPlus, FiBox, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const ProductAdmin = () => {
  const [productData, setProductData] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchQuery])

  const fetchProductData = async () => {
    try {
      setLoading(true)
      const response = await Axios.get(SummaryApi.getProduct.url, {
        params: { page, search: debouncedSearch }
      })

      const { data: responseData } = response
      if (responseData?.success) {
        setProductData(responseData.data || [])
        setTotalPages(responseData.totalPages || 1)
        setTotalCount(responseData.totalCount || responseData.totalNoProduct || (responseData.data?.length || 0))
      } else {
        setProductData([])
        setTotalPages(1)
        setTotalCount(0)
      }
    } catch (error) {
      AxiosToastError(error)
      setProductData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch])

  return (
    <div className='space-y-6 animate-fadeIn'>
      {/* Page Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-bold text-surface-title tracking-tight'>
              Product Inventory
            </h1>
            {!loading && totalCount > 0 && (
              <span className='badge-brand text-xs font-semibold px-2.5 py-0.5'>
                {totalCount} SKUs
              </span>
            )}
          </div>
          <p className='text-sm text-surface-muted mt-1'>
            Manage catalog pricing, stock inventory, and product listings
          </p>
        </div>

        <Link
          to='/dashboard/upload-product'
          className='btn-primary self-start sm:self-auto inline-flex items-center gap-2 font-semibold text-sm shadow-subtle'
        >
          <FiPlus size={16} />
          <span>Upload Product</span>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className='bg-white rounded-card border border-surface-border shadow-card p-4'>
        <div className='relative max-w-md'>
          <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-muted'>
            <FiSearch size={16} />
          </div>
          <input
            type='text'
            aria-label='Search products in inventory'
            placeholder='Search product by name or SKU...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='input-field pl-10'
          />
        </div>
      </div>

      {/* Product Content Area */}
      {loading ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4'>
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className='bg-white rounded-card border border-surface-border p-4 shadow-card animate-pulse space-y-3'
            >
              <div className='w-full h-40 bg-surface-100 rounded-control' />
              <div className='h-4 bg-surface-100 rounded w-3/4' />
              <div className='h-3 bg-surface-50 rounded w-1/2' />
              <div className='h-5 bg-surface-100 rounded w-1/3 pt-2' />
            </div>
          ))}
        </div>
      ) : productData.length === 0 ? (
        <div className='bg-white rounded-card border border-surface-border p-8 sm:p-12 shadow-card'>
          <NoData
            icon={FiBox}
            title={debouncedSearch ? 'No matching products found' : 'No products in inventory'}
            description={
              debouncedSearch
                ? `No products match "${debouncedSearch}". Try a different search term.`
                : 'Upload your first product SKU to start populating your catalog.'
            }
            actionText={debouncedSearch ? 'Clear Search' : 'Upload Product'}
            onAction={debouncedSearch ? () => setSearchQuery('') : undefined}
            actionHref={debouncedSearch ? undefined : '/dashboard/upload-product'}
          />
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4'>
            {productData.map((p) => (
              <ProductCardAdmin key={p._id} data={p} fetchData={fetchProductData} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between bg-white rounded-card border border-surface-border shadow-card p-4'>
              <button
                type='button'
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className='btn-secondary py-2 px-3 sm:px-4 text-xs font-semibold inline-flex items-center gap-1.5'
              >
                <FiChevronLeft size={15} />
                <span>Previous</span>
              </button>

              <span className='text-xs font-semibold text-surface-muted'>
                Page <span className='text-surface-title font-bold'>{page}</span> of{' '}
                <span className='text-surface-title font-bold'>{totalPages}</span>
              </span>

              <button
                type='button'
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages}
                className='btn-secondary py-2 px-3 sm:px-4 text-xs font-semibold inline-flex items-center gap-1.5'
              >
                <span>Next</span>
                <FiChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ProductAdmin
