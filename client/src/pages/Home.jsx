import React, { useCallback, useMemo } from 'react'
import banner from '../assets/banner.jpg'
import bannerMobile from '../assets/banner-mobile.jpg'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { IoSearch } from 'react-icons/io5'
import { FiTruck, FiShield, FiCheckCircle, FiClock, FiLayers } from 'react-icons/fi'
import CategoryWiseProductDisplay from '../components/CategoryWiseProductDisplay'
import { validURLConvert } from '../utils/validURLConver'

const Home = () => {
  const loadingCategory = useSelector((state) => state.product.loadingCategory)
  const categoryData = useSelector((state) => state.product.allCategory)
  const subCategoryData = useSelector((state) => state.product.allSubCategory)
  const navigate = useNavigate()

  const handleRedirectProductListPage = useCallback(
    (id, cat) => {
      const subcategory = subCategoryData.find((sub) =>
        sub.category.some((c) => (typeof c === 'object' ? c._id === id : c === id))
      )

      if (!subcategory) {
        return // Prevent crash if no subcategory linked yet
      }

      const categoryId = id
      const subCategoryId = subcategory._id

      const url = `/${validURLConvert(cat || 'category')}-${categoryId}/${validURLConvert(subcategory.name || 'subcategory')}-${subCategoryId}`
      navigate(url)
    },
    [subCategoryData, navigate]
  )

  const reversedCategories = useMemo(
    () => (categoryData ? [...categoryData].reverse() : []),
    [categoryData]
  )

  return (
    <div className='w-full min-h-screen bg-white'>
      {/* Hero Section */}
      <section className='container mx-auto px-3 sm:px-4 pt-4 pb-2'>
        <div className='relative rounded-card overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 text-white shadow-elevated p-5 sm:p-8 lg:p-10 border border-emerald-800/40'>
          {/* Subtle Ambient Depth Lighting */}
          <div className='absolute -right-16 -top-16 w-64 h-64 sm:w-80 sm:h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none' />
          <div className='absolute right-1/4 -bottom-20 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none' />

          {/* Content-side high-contrast directional overlay */}
          <div className='absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/50 to-transparent pointer-events-none' />

          {/* Subtle Accent Grid Overlay */}
          <div className='absolute inset-0 opacity-[0.07] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none' />

          {/* Living Hero Copy Block with subtle desktop micro-interaction */}
          <div className='relative z-10 max-w-2xl transition-transform duration-300 ease-out group/hero hover:-translate-y-0.5'>
            {/* Eyebrow badge */}
            <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 backdrop-blur-md text-emerald-200 text-xs font-medium mb-3 sm:mb-4 border border-emerald-700/50 shadow-sm transition-colors duration-200 group-hover/hero:border-emerald-500/60 group-hover/hero:bg-emerald-900/70'>
              <span className='text-amber-400 font-bold flex items-center gap-1'>⚡ Quick Commerce</span>
              <span className='text-emerald-400/60'>•</span>
              <span className='text-emerald-100 font-medium'>Everyday Essentials Delivered Fast</span>
            </div>

            {/* Main heading with high-contrast text */}
            <h1 className='text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white mb-2 sm:mb-3 drop-shadow-sm transition-colors duration-200'>
              Fresh Groceries & Daily Essentials At Your Door
            </h1>

            {/* Supporting paragraph */}
            <p className='text-xs sm:text-sm lg:text-base text-emerald-100/95 leading-relaxed mb-5 sm:mb-6 max-w-xl font-normal transition-colors duration-200'>
              Order farm-fresh vegetables, dairy, pantry staples, snacks, and household items in minutes with complete checkout security.
            </p>

            {/* Action Bar */}
            <div className='flex flex-wrap items-center gap-3'>
              <button
                type='button'
                onClick={() => navigate('/search')}
                aria-label='Search all products'
                className='btn-accent text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 shadow-card inline-flex items-center gap-2 cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900'
              >
                <IoSearch size={16} />
                <span>Search Products</span>
              </button>

              <a
                href='#categories'
                className='btn-outline border-emerald-400/40 bg-white/5 backdrop-blur-sm text-emerald-100 hover:bg-white/15 hover:text-white hover:border-emerald-300 text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 inline-flex items-center transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900'
              >
                Explore Categories
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className='container mx-auto px-3 sm:px-4 my-4'>
        <div className='w-full rounded-card overflow-hidden shadow-subtle border border-surface-border bg-surface-100'>
          <img
            src={banner}
            className='w-full h-auto hidden lg:block object-cover'
            alt='GrabItGo daily essentials & fresh discounts banner'
            loading='eager'
            fetchPriority='high'
          />
          <img
            src={bannerMobile}
            className='w-full h-auto lg:hidden object-cover'
            alt='GrabItGo daily essentials & fresh discounts banner'
            loading='eager'
            fetchPriority='high'
          />
        </div>
      </section>

      {/* Trust & Service Highlights */}
      <section className='container mx-auto px-3 sm:px-4 my-6'>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4'>
          <div className='bg-surface-50 border border-surface-border/70 rounded-card p-4 flex items-center gap-3.5 shadow-subtle'>
            <div className='w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0'>
              <FiTruck size={20} />
            </div>
            <div>
              <h3 className='font-semibold text-xs sm:text-sm text-surface-title'>Fast Local Dispatch</h3>
              <p className='text-xs text-surface-muted'>Packed & dispatched from your neighborhood hub</p>
            </div>
          </div>

          <div className='bg-surface-50 border border-surface-border/70 rounded-card p-4 flex items-center gap-3.5 shadow-subtle'>
            <div className='w-10 h-10 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center shrink-0'>
              <FiCheckCircle size={20} />
            </div>
            <div>
              <h3 className='font-semibold text-xs sm:text-sm text-surface-title'>Quality Assured</h3>
              <p className='text-xs text-surface-muted'>Hand-selected fresh items & verified brands</p>
            </div>
          </div>

          <div className='bg-surface-50 border border-surface-border/70 rounded-card p-4 flex items-center gap-3.5 shadow-subtle'>
            <div className='w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0'>
              <FiShield size={20} />
            </div>
            <div>
              <h3 className='font-semibold text-xs sm:text-sm text-surface-title'>Secure Payments</h3>
              <p className='text-xs text-surface-muted'>Safe card checkout with Stripe & UPI support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Discovery Section */}
      <section id='categories' className='container mx-auto px-3 sm:px-4 my-6 scroll-mt-20'>
        <div className='mb-4'>
          <h2 className='font-bold text-base sm:text-lg md:text-xl text-surface-title tracking-tight'>
            Shop by Category
          </h2>
          <p className='text-xs sm:text-sm text-surface-muted'>
            Handpicked essentials across all your daily grocery needs
          </p>
        </div>

        <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 sm:gap-3.5'>
          {loadingCategory ? (
            new Array(10).fill(null).map((_, index) => (
              <div
                key={index + 'loadingcategory'}
                className='bg-white border border-surface-border rounded-card p-3 min-h-28 flex flex-col items-center justify-center gap-2 shadow-subtle animate-pulse'
              >
                <div className='bg-surface-200 w-12 h-12 rounded-full'></div>
                <div className='bg-surface-200 h-3 w-16 rounded'></div>
              </div>
            ))
          ) : (
            categoryData.map((cat) => (
              <div
                key={cat._id + 'displayCategory'}
                role='button'
                tabIndex={0}
                aria-label={`View ${cat.name || 'category'} products`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleRedirectProductListPage(cat._id, cat.name)
                  }
                }}
                onClick={() => handleRedirectProductListPage(cat._id, cat.name)}
                className='bg-white border border-surface-border rounded-card p-2 sm:p-2.5 flex flex-col items-center justify-between text-center hover:border-brand-300 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[96px] sm:min-h-[108px]'
              >
                <div className='w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center p-1 mb-1'>
                  <img
                    src={cat.image}
                    className='w-full h-full object-contain group-hover:scale-105 transition-transform duration-200'
                    alt={cat.name || 'category'}
                    loading='lazy'
                  />
                </div>
                <span className='text-[11px] sm:text-xs font-semibold text-surface-title line-clamp-2 leading-tight group-hover:text-brand-700'>
                  {cat.name}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Product Discovery Sections (Lazy-loaded with IntersectionObserver) */}
      <div className='my-4 divide-y divide-surface-border/40'>
        {reversedCategories.map((c) => (
          <CategoryWiseProductDisplay
            key={c?._id + 'CategoryWiseProduct'}
            id={c?._id}
            name={c?.name}
          />
        ))}
      </div>

      {/* Why Choose GrabItGo / Value Proposition Section */}
      <section className='bg-surface-50/70 border-t border-surface-border py-10 my-8'>
        <div className='container mx-auto px-3 sm:px-4'>
          <div className='text-center max-w-xl mx-auto mb-8'>
            <span className='text-brand-600 font-bold text-xs tracking-wider uppercase'>The GrabItGo Advantage</span>
            <h2 className='text-xl sm:text-2xl font-bold text-surface-title tracking-tight mt-1'>
              Designed for Your Everyday Routine
            </h2>
            <p className='text-xs sm:text-sm text-surface-muted mt-1.5'>
              Everything from morning milk to evening snacks, delivered with care and speed.
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto'>
            <div className='bg-white border border-surface-border rounded-card p-5 text-center sm:text-left shadow-subtle hover:shadow-card transition-shadow'>
              <div className='w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-3 mx-auto sm:mx-0'>
                <FiClock size={20} />
              </div>
              <h3 className='font-semibold text-sm text-surface-title mb-1'>Instant Fulfillment</h3>
              <p className='text-xs text-surface-muted leading-relaxed'>
                Order essentials whenever you need them without planning days in advance.
              </p>
            </div>

            <div className='bg-white border border-surface-border rounded-card p-5 text-center sm:text-left shadow-subtle hover:shadow-card transition-shadow'>
              <div className='w-10 h-10 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center mb-3 mx-auto sm:mx-0'>
                <FiLayers size={20} />
              </div>
              <h3 className='font-semibold text-sm text-surface-title mb-1'>Wide Assortment</h3>
              <p className='text-xs text-surface-muted leading-relaxed'>
                Discover thousands of fresh items, household goods, and pantry supplies.
              </p>
            </div>

            <div className='bg-white border border-surface-border rounded-card p-5 text-center sm:text-left shadow-subtle hover:shadow-card transition-shadow'>
              <div className='w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-3 mx-auto sm:mx-0'>
                <FiShield size={20} />
              </div>
              <h3 className='font-semibold text-sm text-surface-title mb-1'>Encrypted Checkout</h3>
              <p className='text-xs text-surface-muted leading-relaxed'>
                Enterprise-grade Stripe card payment processing with instant confirmation.
              </p>
            </div>

            <div className='bg-white border border-surface-border rounded-card p-5 text-center sm:text-left shadow-subtle hover:shadow-card transition-shadow'>
              <div className='w-10 h-10 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center mb-3 mx-auto sm:mx-0'>
                <FiCheckCircle size={20} />
              </div>
              <h3 className='font-semibold text-sm text-surface-title mb-1'>Live Order Status</h3>
              <p className='text-xs text-surface-muted leading-relaxed'>
                Keep track of your active orders and review past purchases in your profile.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
