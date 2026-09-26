import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import SummaryApi from '../common/SummaryApi'
import Axios from '../utils/axios'
import AxiosToastError from '../utils/AxiosToastError'
import CardLoading from '../components/CardLoading'
import CardProduct from '../components/CardProduct'
import NoData from '../components/NoData'
import ProductSortFilter from '../components/ProductSortFilter'
import { useDebounce } from '../hooks/useDebounce'
import { IoSearch, IoClose } from 'react-icons/io5'

const SearchPage = () => {
  const [data, setData] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const initialSearch = searchParams.get('q') || ''
  const sort = searchParams.get('sort') || ''
  const inStock = searchParams.get('inStock') === 'true'

  const [searchText, setSearchText] = useState(initialSearch)
  const searchRequestIdRef = useRef(0)

  useEffect(() => {
    setSearchText(initialSearch)
  }, [initialSearch])

  // Responsive 300ms debounce
  const debouncedSearch = useDebounce(searchText, 300)

  // Sync search text back to URL query param if user typed something new
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      const currentQ = next.get('q') || ''
      const trimmed = debouncedSearch.trim()
      if (trimmed) {
        if (currentQ !== trimmed) {
          next.set('q', trimmed)
          return next
        }
      } else {
        if (next.has('q')) {
          next.delete('q')
          return next
        }
      }
      return prev
    }, { replace: true })
  }, [debouncedSearch, setSearchParams])

  const handleSortChange = (newSort) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (newSort) {
        next.set('sort', newSort)
      } else {
        next.delete('sort')
      }
      return next
    })
  }

  const handleInStockChange = (newInStock) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (newInStock) {
        next.set('inStock', 'true')
      } else {
        next.delete('inStock')
      }
      return next
    })
  }

  const handleReset = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('sort')
      next.delete('inStock')
      return next
    })
  }

  const fetchData = useCallback(async (searchQuery = debouncedSearch, pageNum = 1) => {
    const currentRequestId = ++searchRequestIdRef.current
    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.getProduct,
        params: {
          search: searchQuery,
          page: pageNum,
          limit: 20,
          sort,
          inStock: inStock ? 'true' : undefined,
        }
      })

      // Race-condition guard: Only update state if this is still the most recent request
      if (currentRequestId === searchRequestIdRef.current && response.data.success) {
        if (pageNum === 1) {
          setData(response.data.data || [])
          setTotalCount(response.data.totalCount ?? (response.data.data || []).length)
        } else {
          setData(prev => [...prev, ...(response.data.data || [])])
          setTotalCount(response.data.totalCount ?? (response.data.data || []).length)
        }
      }
    } catch (error) {
      if (currentRequestId === searchRequestIdRef.current) {
        AxiosToastError(error)
      }
    } finally {
      if (currentRequestId === searchRequestIdRef.current) {
        setLoading(false)
      }
    }
  }, [debouncedSearch, sort, inStock])

  useEffect(() => {
    if (debouncedSearch && debouncedSearch.trim()) {
      fetchData(debouncedSearch.trim(), 1)
    } else {
      setData([])
      setTotalCount(0)
      setLoading(false)
    }
  }, [debouncedSearch, fetchData])

  const handleSearchChange = (e) => {
    setSearchText(e.target.value)
  }

  const handleClearSearch = () => {
    setSearchText('')
    setData([])
    setTotalCount(0)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('q')
      return next
    })
  }

  const isFiltered = Boolean(sort || inStock)

  return (
    <section className='min-h-[calc(100vh-80px)] bg-surface-50 py-6'>
      <div className='container mx-auto px-3 sm:px-6 max-w-7xl'>
        {/* Prominent Search Bar */}
        <div className='bg-white rounded-card border border-surface-border shadow-subtle p-2 sm:p-2.5 flex items-center gap-3 mb-4 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all'>
          <div className='text-surface-muted pl-2'>
            <IoSearch size={22} className='text-brand-600' />
          </div>
          <input
            type='text'
            autoFocus
            aria-label='Search products'
            placeholder='Search products, dairy, snacks, fresh produce...'
            className='w-full outline-none bg-transparent text-sm sm:text-base text-surface-title placeholder:text-surface-muted py-1'
            value={searchText}
            onChange={handleSearchChange}
          />
          {searchText && (
            <button
              type='button'
              onClick={handleClearSearch}
              aria-label='Clear search text'
              className='p-1.5 hover:bg-surface-50 rounded-full text-surface-muted hover:text-surface-title transition-colors cursor-pointer mr-1'
            >
              <IoClose size={20} />
            </button>
          )}
        </div>

        {/* Results Header and Sort/Filter Controls */}
        {debouncedSearch.trim() && (
          <>
            <div className='flex items-center justify-between mb-3 flex-wrap gap-2 px-1'>
              <h1 className='font-bold text-sm sm:text-base text-surface-title'>
                Results for <span className='text-brand-700'>"{debouncedSearch}"</span>
              </h1>
              {!loading && (
                <span className='badge-neutral text-xs font-semibold px-2.5 py-1'>
                  {totalCount} {totalCount === 1 ? 'Product' : 'Products'} Found
                </span>
              )}
            </div>

            <ProductSortFilter
              sort={sort}
              inStock={inStock}
              onSortChange={handleSortChange}
              onInStockChange={handleInStockChange}
              onReset={handleReset}
              totalCount={totalCount}
            />
          </>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4'>
            {new Array(10).fill(null).map((_, index) => (
              <CardLoading key={'SearchSkeleton' + index} />
            ))}
          </div>
        )}

        {/* Empty State when no query is typed */}
        {!loading && !debouncedSearch.trim() && (
          <div className='py-16 bg-white rounded-card border border-surface-border my-4'>
            <NoData
              title='Search Fresh Groceries & Daily Essentials'
              description='Type any product name, brand, or ingredient to discover items in seconds.'
              actionText='Explore All Categories'
              actionHref='/#categories'
            />
          </div>
        )}

        {/* Empty State when query returned 0 items */}
        {!loading && debouncedSearch.trim() && data.length === 0 && (
          <div className='py-16 bg-white rounded-card border border-surface-border my-4'>
            <NoData
              title={isFiltered ? `No matching products for "${debouncedSearch}"` : `No products found for "${debouncedSearch}"`}
              description={
                isFiltered
                  ? 'Try clearing your filters or selecting a different sort option to view all matching results.'
                  : 'Please check the spelling or try searching for broader keywords like "milk", "bread", or "vegetables".'
              }
              actionText={isFiltered ? 'Clear Filters' : 'Browse Categories'}
              actionHref={isFiltered ? undefined : '/#categories'}
              onAction={isFiltered ? handleReset : undefined}
            />
          </div>
        )}

        {/* Product Grid */}
        {!loading && data.length > 0 && (
          <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4'>
            {data.map((product, index) => (
              <CardProduct key={product._id + index} data={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default SearchPage
