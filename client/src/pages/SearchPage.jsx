import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import SummaryApi from '../common/SummaryApi'
import Axios from '../utils/Axios'
import AxiosToastError from '../utils/AxiosToastError'
import Loading from '../components/Loading'
import CardProduct from '../components/CardProduct'
import { useDebounce } from '../hooks/useDebounce'

const SearchPage = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalPage, setTotalPage] = useState(1)
  const [page, setPage] = useState(1)
  const [searchText, setSearchText] = useState('')


  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const initialSearch = searchParams.get('q') || ''

  useEffect(() => {
    setSearchText(initialSearch)
  }, [initialSearch])

  const debouncedSearch = useDebounce(searchText, 500)

  const fetchData = async (searchQuery = debouncedSearch, pageNum = 1) => {
    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.getProduct,
        params: {
          search: searchQuery,
          page: pageNum,
          limit: 20
        }
      })

      if (response.data.success) {
        if (pageNum === 1) {
          setData(response.data.data)
        } else {
          setData(prev => [...prev, ...response.data.data])
        }

        setTotalPage(response.data.totalPages)
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (debouncedSearch) {
      setPage(1)
      fetchData(debouncedSearch, 1)
    } else {
      setData([])
    }
  }, [debouncedSearch])



  const handleSearchChange = (e) => {
    setSearchText(e.target.value)
  }

  return (
    <div className='bg-white'>
      <div className='container mx-auto p-4'>
        <div className='p-2 bg-slate-100 mb-4 rounded'>
          <input
            type='text'
            placeholder='Search for products...'
            className='w-full outline-none bg-transparent'
            value={searchText}
            onChange={handleSearchChange}
          />
        </div>

        {loading && data.length === 0 && (
          <Loading />
        )}

        {!loading && data.length === 0 && searchText && (
          <div className='text-center py-12'>
            <p className='text-gray-500 text-lg'>No products found for "{searchText}"</p>
            <p className='text-gray-400 text-sm'>Try searching with different keywords</p>
          </div>
        )}

        {data.length > 0 && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {data.map((product, index) => (
              <CardProduct
                key={product._id + index}
                data={product}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchPage
