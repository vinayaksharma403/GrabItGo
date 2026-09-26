import React, { useState } from 'react'
import EditProductAdmin from './EditProductAdmin'
import ConfirmBox from './ConfirmBox'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { toast } from 'react-hot-toast'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'

const ProductCardAdmin = ({ data, fetchData }) => {
  const [currentImage, setCurrentImage] = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleDelete = async () => {
    try {
      const res = await Axios({
        method: 'DELETE',
        url: SummaryApi.deleteProductDetails.url,
        params: { _id: data._id }
      })

      if (res.data.success) {
        toast.success(res.data.message || 'Product deleted successfully')
        fetchData?.()
      }
    } catch (err) {
      AxiosToastError(err)
    } finally {
      setDeleteOpen(false)
    }
  }

  const imageSrc =
    Array.isArray(data?.image) && data.image.length > 0
      ? data.image[currentImage]
      : typeof data?.image === 'string' && data.image
      ? data.image
      : '/placeholder.png'

  return (
    <div className='group bg-white border border-slate-200/80 rounded-2xl shadow-card hover:border-slate-300 hover:shadow-hover transition-all duration-200 overflow-hidden flex flex-col justify-between'>
      {/* Product Image Frame */}
      <div className='relative w-full h-44 bg-slate-50 flex items-center justify-center p-3'>
        <img
          src={imageSrc}
          alt={data?.name || 'Product SKU'}
          loading='lazy'
          onError={(e) => {
            if (e.target.src !== '/placeholder.png') {
              e.target.src = '/placeholder.png'
            }
          }}
          className='w-full h-full object-contain transition-transform duration-300 group-hover:scale-105'
        />

        {/* Multiple Image Dots */}
        {Array.isArray(data?.image) && data.image.length > 1 && (
          <div className='absolute bottom-2 flex justify-center gap-1.5 w-full'>
            {data.image.map((_, idx) => (
              <button
                type='button'
                key={idx}
                onClick={() => setCurrentImage(idx)}
                aria-label={`View image ${idx + 1}`}
                className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${
                  currentImage === idx
                    ? 'bg-emerald-600'
                    : 'bg-slate-300 hover:bg-emerald-400'
                }`}
              />
            ))}
          </div>
        )}

        {/* Stock Badge */}
        {data?.stock != null && (
          <div className='absolute top-2 left-2'>
            {Number(data.stock) <= 0 ? (
              <span className='badge-error text-[10px] px-2 py-0.5'>Out of Stock</span>
            ) : Number(data.stock) <= 5 ? (
              <span className='badge-warning text-[10px] px-2 py-0.5'>
                Low: {data.stock}
              </span>
            ) : (
              <span className='badge-brand text-[10px] px-2 py-0.5'>
                Stock: {data.stock}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className='p-4 flex-1 flex flex-col justify-between text-left'>
        <div>
          <h3 className='font-bold text-sm text-slate-900 truncate' title={data?.name}>
            {data?.name || 'Untitled SKU'}
          </h3>
          <p className='text-xs text-slate-500 mt-0.5'>{data?.unit || '1 unit'}</p>
        </div>

        <div className='mt-3 pt-2 border-t border-slate-100 flex items-baseline justify-between'>
          <span className='font-bold text-sm text-emerald-700'>
            {data?.price != null ? DisplayPriceInRupees(data.price) : '—'}
          </span>
          {data?.discount ? (
            <span className='text-[11px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded'>
              {data.discount}% OFF
            </span>
          ) : null}
        </div>
      </div>

      {/* Action Buttons */}
      <div className='px-3 pb-3 pt-1 flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50'>
        <button
          type='button'
          onClick={() => setEditOpen(true)}
          className='flex-1 btn-secondary py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5'
        >
          <FiEdit2 size={13} />
          <span>Edit</span>
        </button>

        <button
          type='button'
          onClick={() => setDeleteOpen(true)}
          className='flex-1 btn-danger py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5'
        >
          <FiTrash2 size={13} />
          <span>Delete</span>
        </button>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <EditProductAdmin
          productId={data._id}
          close={() => setEditOpen(false)}
          fetchData={fetchData}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteOpen && (
        <ConfirmBox
          title='Delete Product SKU'
          message={`Are you sure you want to permanently delete "${data.name}" from inventory?`}
          cancel={() => setDeleteOpen(false)}
          confirm={handleDelete}
          close={() => setDeleteOpen(false)}
        />
      )}
    </div>
  )
}

export default ProductCardAdmin
