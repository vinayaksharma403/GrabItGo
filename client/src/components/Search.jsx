import React, { useEffect, useState } from 'react'
import { IoSearch } from "react-icons/io5";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TypeAnimation } from 'react-type-animation';
import { FaArrowLeft } from "react-icons/fa";
import useMobile from '../hooks/useMobile';

const Search = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isSearchPage, setIsSearchPage] = useState(false)
  const [isMobile] = useMobile()

  useEffect(() => {
    const isSearch = location.pathname === "/search"
    setIsSearchPage(isSearch)
  }, [location])

  const redirectToSearchPage = () => {
    navigate("/search")
  }

  return (
    <div
      role="search"
      aria-label="Product Search"
      className='w-full min-w-0 h-11 lg:h-12 rounded-control border border-surface-border overflow-hidden flex items-center text-surface-muted bg-surface-50 group focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:bg-white transition-all shadow-subtle'
    >
      <div>
        {isMobile && isSearchPage ? (
          <Link
            to={"/"}
            aria-label="Go back to Home"
            className='flex justify-center items-center h-full p-2 m-1 group-focus-within:text-brand-600 bg-white rounded-full shadow-subtle min-w-[36px] min-h-[36px]'
          >
            <FaArrowLeft size={18} />
          </Link>
        ) : (
          <button
            type="button"
            className='flex justify-center items-center h-full p-3 group-focus-within:text-brand-600 min-w-[44px] min-h-[44px] cursor-pointer'
            onClick={redirectToSearchPage}
            aria-label="Search products"
          >
            <IoSearch size={20} />
          </button>
        )}
      </div>

      <div className='w-full h-full min-w-0'>
        {!isSearchPage ? (
          <div
            onClick={redirectToSearchPage}
            className='w-full h-full flex items-center cursor-pointer text-sm pr-3 truncate select-none'
          >
            <TypeAnimation
              sequence={[
                'Search "milk"',
                1000,
                'Search "sugar"',
                1000,
                'Search "bread"',
                1000,
                'Search "paneer"',
                1000,
                'Search "chocolate"',
                1000,
                'Search "curd"',
                1000,
                'Search "chips"',
                1000,
                'Search "rice"',
                1000,
                'Search "eggs"',
                1000
              ]}
              wrapper="span"
              speed={50}
              repeat={Infinity}
            />
          </div>
        ) : (
          <div className='w-full h-full flex items-center px-2 text-sm text-neutral-400'>
            Search
          </div>
        )}
      </div>
    </div>
  )
}

export default Search
