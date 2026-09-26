import React from 'react'
import { FiSliders, FiRotateCcw, FiCheck } from 'react-icons/fi'

const sortOptions = [
  { value: '', label: 'Default / Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'discount_desc', label: 'Discount: Highest First' },
]

const ProductSortFilter = ({ sort = '', inStock = false, onSortChange, onInStockChange, onReset, totalCount }) => {
  const isFiltered = Boolean(sort || inStock)

  return (
    <div className='bg-white rounded-card border border-surface-border p-3 sm:p-3.5 mb-4 shadow-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-fadeIn'>
      {/* Left: Filter & Sort Controls */}
      <div className='flex items-center gap-3 flex-wrap sm:flex-nowrap'>
        <div className='flex items-center gap-1.5 text-xs font-bold text-surface-muted uppercase tracking-wider shrink-0'>
          <FiSliders size={14} className='text-brand-600' />
          <span>Sort & Filter:</span>
        </div>

        {/* Sort Select */}
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label='Sort products'
          className='input-field py-1.5 px-3 text-xs sm:text-sm bg-surface-50 font-medium text-surface-title border-surface-border cursor-pointer min-w-[170px]'
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* In-Stock Toggle Button */}
        <button
          type='button'
          onClick={() => onInStockChange(!inStock)}
          aria-pressed={inStock}
          aria-label='Filter products in stock only'
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs sm:text-sm font-semibold border transition-all cursor-pointer select-none shrink-0 ${
            inStock
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
              : 'bg-surface-50 text-surface-muted hover:text-surface-title border-surface-border hover:bg-surface-100'
          }`}
        >
          <span
            className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] transition-colors ${
              inStock ? 'bg-brand-600 text-white' : 'border border-slate-400'
            }`}
          >
            {inStock && <FiCheck size={10} strokeWidth={3} />}
          </span>
          <span>In Stock Only</span>
        </button>

        {/* Reset Button */}
        {isFiltered && (
          <button
            type='button'
            onClick={onReset}
            aria-label='Reset filters and sorting'
            className='inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0'
          >
            <FiRotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Right: Count Metadata */}
      {typeof totalCount === 'number' && (
        <div className='text-xs text-surface-muted font-medium shrink-0 self-end sm:self-auto'>
          Showing <span className='font-bold text-surface-title'>{totalCount}</span> {totalCount === 1 ? 'item' : 'items'}
        </div>
      )}
    </div>
  )
}

export default ProductSortFilter
