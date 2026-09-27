import React, { useEffect, useState, useCallback } from 'react'
import UploadSubCategoryModel from '../components/UploadSubCategoryModel'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import { createColumnHelper } from '@tanstack/react-table'
import DisplayTable from '../components/DisplayTable'
import ViewImage from '../components/viewImage'
import EditSubCategory from '../components/EditSubCategory'
import toast from 'react-hot-toast'
import ConfirmBox from '../components/ConfirmBox'
import NoData from '../components/NoData'
import { FiPlus, FiLayers } from 'react-icons/fi'

const SubCategoryPage = () => {
  const [openAddSubCategory, setOpenAddSubCategory] = useState(false)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const columnHelper = createColumnHelper()
  const [imageURL, setImageURL] = useState('')
  const [openEdit, setOpenEdit] = useState(false)
  const [editData, setEditData] = useState({ _id: '' })
  const [deleteSubCategory, setDeleteSubCategory] = useState(null)
  const [openDeleteConfirmBox, setOpenDeleteConfirmBox] = useState(false)

  const fetchSubCategory = useCallback(async () => {
    try {
      setLoading(true)
      const response = await Axios({ ...SummaryApi.getSubCategory, data: {} })
      const { data: responseData } = response
      if (responseData.success) {
        setData(responseData.data || [])
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubCategory()
  }, [fetchSubCategory])

  const handleDelete = (row) => {
    setDeleteSubCategory(row)
    setOpenDeleteConfirmBox(true)
  }

  const handleDeleteSubCategory = async () => {
    if (!deleteSubCategory) return
    try {
      const response = await Axios({
        ...SummaryApi.deleteSubCategory,
        method: 'delete',
        data: { _id: deleteSubCategory._id }
      })

      if (response.data.success) {
        toast.success(response.data.message || 'Subcategory deleted successfully')
        setOpenDeleteConfirmBox(false)
        setDeleteSubCategory(null)
        fetchSubCategory()
      } else {
        toast.error(response.data.message || 'Failed to delete')
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  const handleEdit = (row) => {
    setEditData(row)
    setOpenEdit(true)
  }

  const columns = [
    columnHelper.accessor('name', {
      header: 'Subcategory Name',
      cell: (info) => (
        <span className='font-bold text-surface-title'>{info.getValue()}</span>
      )
    }),
    columnHelper.accessor('image', {
      header: 'Thumbnail',
      cell: (info) => (
        <div className='w-12 h-12 rounded-xl bg-surface-50 border border-surface-border overflow-hidden flex items-center justify-center p-1 cursor-pointer group hover:border-brand-500 transition-colors'>
          <img
            src={info.getValue() || '/placeholder.png'}
            alt='Subcategory preview'
            loading='lazy'
            onError={(e) => {
              if (e.target.src !== '/placeholder.png') {
                e.target.src = '/placeholder.png'
              }
            }}
            className='w-full h-full object-contain group-hover:scale-105 transition-transform'
            onClick={() => setImageURL(info.getValue())}
          />
        </div>
      )
    }),
    columnHelper.accessor('category', {
      header: 'Parent Categories',
      cell: (info) => {
        const catArray = info.getValue()
        if (!catArray || catArray.length === 0) {
          return <span className='text-surface-muted'>—</span>
        }
        return (
          <div className='flex flex-wrap gap-1'>
            {catArray.map((cat, idx) => (
              <span
                key={cat?._id || idx}
                className='badge-neutral text-[11px] px-2 py-0.5'
              >
                {cat?.name || 'Category'}
              </span>
            ))}
          </div>
        )
      }
    })
  ]

  return (
    <div className='space-y-6 animate-fadeIn'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-bold text-surface-title tracking-tight'>
              Subcategory Management
            </h1>
            {!loading && data.length > 0 && (
              <span className='badge-brand text-xs font-semibold px-2.5 py-0.5'>
                {data.length} Subcategories
              </span>
            )}
          </div>
          <p className='text-sm text-surface-muted mt-1'>
            Organize secondary groupings mapped to parent categories
          </p>
        </div>

        <button
          type='button'
          onClick={() => setOpenAddSubCategory(true)}
          className='btn-primary self-start sm:self-auto inline-flex items-center gap-2 font-semibold text-sm shadow-subtle cursor-pointer'
        >
          <FiPlus size={16} />
          <span>Add Subcategory</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className='bg-white rounded-card border border-surface-border p-6 shadow-subtle space-y-3 animate-pulse'>
          <div className='h-8 bg-surface-200 rounded-lg w-full mb-4' />
          {[...Array(5)].map((_, idx) => (
            <div key={idx} className='h-12 bg-surface-100 rounded-lg w-full' />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className='bg-white rounded-card border border-surface-border p-8 sm:p-12 shadow-subtle'>
          <NoData
            icon={FiLayers}
            title='No Subcategories Found'
            description='Add subcategories to help shoppers navigate detailed product lines.'
            actionText='Add Subcategory'
            onAction={() => setOpenAddSubCategory(true)}
          />
        </div>
      ) : (
        <DisplayTable
          data={data}
          columns={columns}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Add Modal */}
      {openAddSubCategory && (
        <UploadSubCategoryModel
          close={() => setOpenAddSubCategory(false)}
          onSuccess={fetchSubCategory}
        />
      )}

      {/* Image Preview Modal */}
      {imageURL && <ViewImage url={imageURL} close={() => setImageURL('')} />}

      {/* Edit Modal */}
      {openEdit && (
        <EditSubCategory
          data={editData}
          close={() => setOpenEdit(false)}
          onSuccess={fetchSubCategory}
        />
      )}

      {/* Delete Confirmation Modal */}
      {openDeleteConfirmBox && (
        <ConfirmBox
          title='Delete Subcategory'
          message={`Are you sure you want to permanently delete subcategory "${deleteSubCategory?.name || 'this item'}"?`}
          cancel={() => setOpenDeleteConfirmBox(false)}
          close={() => setOpenDeleteConfirmBox(false)}
          confirm={handleDeleteSubCategory}
        />
      )}
    </div>
  )
}

export default SubCategoryPage
