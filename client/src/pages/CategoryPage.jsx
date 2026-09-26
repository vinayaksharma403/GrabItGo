import React, { useState, useEffect, useCallback } from 'react'
import UploadCategoryModel from '../components/UploadCategoryModel'
import NoData from '../components/NoData'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import EditCategory from '../components/EditCategory'
import ConfirmBox from '../components/ConfirmBox'
import AxiosToastError from '../utils/AxiosToastError'
import toast from 'react-hot-toast'
import { FiPlus, FiGrid, FiEdit2, FiTrash2 } from 'react-icons/fi'

const CategoryPage = () => {
  const [openUploadCategory, setOpenUploadCategory] = useState(false)
  const [loading, setLoading] = useState(true)
  const [categoryData, setCategoryData] = useState([])
  const [openEdit, setOpenEdit] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    image: ''
  })
  const [openConfirmBoxDelete, setOpenConfirmBoxDelete] = useState(false)
  const [deleteCategory, setDeleteCategory] = useState({
    _id: ''
  })

  const fetchCategory = useCallback(async () => {
    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.getCategory
      })
      const { data: responseData } = response

      if (responseData.success) {
        setCategoryData(responseData.data || [])
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategory()
  }, [fetchCategory])

  const handleDeleteCategory = async () => {
    try {
      const response = await Axios({
        ...SummaryApi.deleteCategory,
        data: deleteCategory
      })
      const { data: responseData } = response

      if (responseData.success) {
        toast.success(responseData.message || 'Category deleted successfully')
        fetchCategory()
        setOpenConfirmBoxDelete(false)
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  return (
    <div className='space-y-6 animate-fadeIn'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-bold text-slate-900 tracking-tight'>
              Category Management
            </h1>
            {!loading && categoryData.length > 0 && (
              <span className='badge-brand text-xs font-semibold px-2.5 py-0.5'>
                {categoryData.length} Categories
              </span>
            )}
          </div>
          <p className='text-sm text-slate-500 mt-1'>
            Organize catalog hierarchy and browse categories
          </p>
        </div>

        <button
          type='button'
          onClick={() => setOpenUploadCategory(true)}
          className='btn-primary self-start sm:self-auto inline-flex items-center gap-2 font-semibold text-sm shadow-subtle'
        >
          <FiPlus size={16} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Content */}
      {loading ? (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4'>
          {[...Array(8)].map((_, idx) => (
            <div
              key={idx}
              className='bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card animate-pulse space-y-3'
            >
              <div className='w-full h-32 bg-slate-200 rounded-xl' />
              <div className='h-4 bg-slate-200 rounded w-2/3 mx-auto' />
            </div>
          ))}
        </div>
      ) : categoryData.length === 0 ? (
        <div className='bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 shadow-card'>
          <NoData
            icon={FiGrid}
            title='No Categories Found'
            description='Create your first category to start organizing products.'
            actionText='Add Category'
            onAction={() => setOpenUploadCategory(true)}
          />
        </div>
      ) : (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4'>
          {categoryData.map((category, index) => (
            <div
              key={category._id || index}
              className='bg-white rounded-2xl border border-slate-200/80 shadow-card hover:border-slate-300 hover:shadow-hover transition-all duration-200 overflow-hidden flex flex-col justify-between group'
            >
              <div className='w-full h-36 flex items-center justify-center p-3 bg-slate-50'>
                <img
                  src={category.image}
                  alt={category.name || 'Category'}
                  loading='lazy'
                  onError={(e) => {
                    e.target.src = '/placeholder.png'
                  }}
                  className='max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300'
                />
              </div>

              <div className='p-3 text-center flex-1'>
                <h3 className='font-bold text-xs sm:text-sm text-slate-900 truncate' title={category.name}>
                  {category.name}
                </h3>
              </div>

              <div className='p-2 flex gap-1.5 border-t border-slate-100 bg-slate-50/50'>
                <button
                  type='button'
                  onClick={() => {
                    setOpenEdit(true)
                    setEditData(category)
                  }}
                  aria-label={`Edit category ${category.name}`}
                  className='flex-1 btn-secondary py-1 text-xs font-semibold inline-flex items-center justify-center gap-1'
                >
                  <FiEdit2 size={12} />
                  <span>Edit</span>
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setOpenConfirmBoxDelete(true)
                    setDeleteCategory(category)
                  }}
                  aria-label={`Delete category ${category.name}`}
                  className='flex-1 btn-danger py-1 text-xs font-semibold inline-flex items-center justify-center gap-1'
                >
                  <FiTrash2 size={12} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {openUploadCategory && (
        <UploadCategoryModel
          close={() => setOpenUploadCategory(false)}
          fetchData={fetchCategory}
        />
      )}

      {/* Edit Modal */}
      {openEdit && (
        <EditCategory
          data={editData}
          close={() => setOpenEdit(false)}
          fetchData={fetchCategory}
        />
      )}

      {/* Delete Confirm Modal */}
      {openConfirmBoxDelete && (
        <ConfirmBox
          title='Delete Category'
          message={`Are you sure you want to delete category "${deleteCategory?.name || 'this item'}"?`}
          close={() => setOpenConfirmBoxDelete(false)}
          cancel={() => setOpenConfirmBoxDelete(false)}
          confirm={handleDeleteCategory}
        />
      )}
    </div>
  )
}

export default CategoryPage
