import React from 'react'
import ProductCardAdmin from './ProductCardAdmin'
import NoData from './NoData'
import { FiBox } from 'react-icons/fi'

const ProductGridAdmin = ({ products, fetchData }) => {
  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h2 className='text-base font-bold text-slate-900'>
          All Products
        </h2>
        {products?.length > 0 && (
          <span className='badge-neutral text-xs font-semibold px-2.5 py-1'>
            {products.length} Items
          </span>
        )}
      </div>

      {/* Grid */}
      {products?.length > 0 ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4'>
          {products.map((item) => (
            <ProductCardAdmin key={item._id} data={item} fetchData={fetchData} />
          ))}
        </div>
      ) : (
        <div className='bg-white rounded-2xl border border-slate-200/80 p-8 shadow-card'>
          <NoData
            icon={FiBox}
            title='No Products in Inventory'
            description='Use the Upload Product page to add new items to your catalog.'
            actionText='Upload Product'
            actionHref='/dashboard/upload-product'
          />
        </div>
      )}
    </div>
  )
}

export default ProductGridAdmin
