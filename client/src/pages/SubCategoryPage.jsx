import React, { useEffect, useState } from 'react'
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
import Loading from '../components/Loading'

const SubCategoryPage = () => {
  const [openAddSubCategory, setOpenAddSubCategory] = useState(false)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const columnHelper = createColumnHelper()
  const [ImageURL, setImageURL] = useState("")
  const [openEdit, setOpenEdit] = useState(false)
  const [editData, setEditData] = useState({ _id: "" })
  const [deleteSubCategory, setDeleteSubCategory] = useState(null)
  const [openDeleteConfirmBox, setOpenDeleteConfirmBox] = useState(false)

  // ✅ Fetch all subcategories
  const fetchSubCategory = async () => {
    try {
      setLoading(true)
      const response = await Axios({ ...SummaryApi.getSubCategory, data: {} })
      const { data: responseData } = response
      if (responseData.success) setData(responseData.data)
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubCategory()
  }, [])

  // ✅ Trigger delete confirm modal
  const handleDelete = (row) => {
    setDeleteSubCategory(row)
    setOpenDeleteConfirmBox(true)
  }

  // ✅ Actual delete after confirmation
  const handleDeleteSubCategory = async () => {
    if (!deleteSubCategory) return
    try {
      const response = await Axios({
        ...SummaryApi.deleteSubCategory,
        method: 'delete',
        data: { _id: deleteSubCategory._id }
      })

      

      if (response.data.success) {
        // ✅ show toast first
        toast.success(response.data.message || "Subcategory deleted successfully")

        // ✅ close confirm box and clear selected subcategory
        setOpenDeleteConfirmBox(false)
        setDeleteSubCategory(null)

        // ✅ refresh data after short delay
        setTimeout(() => {
          fetchSubCategory()
        }, 300)
      } else {
        toast.error(response.data.message || "Failed to delete")
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  // ✅ Handle edit click
  const handleEdit = (row) => {
    setEditData(row)
    setOpenEdit(true)
  }

  // ✅ Table columns
  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => <span>{info.getValue()}</span>,
    }),
    columnHelper.accessor('image', {
      header: 'Image',
      cell: (info) => (
        <img
          src={info.getValue()}
          alt="Subcategory"
          className="w-20 h-20 object-cover rounded-md border cursor-pointer"
          onClick={() => setImageURL(info.getValue())}
        />
      ),
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      cell: (info) => {
        const catArray = info.getValue()
        if (!catArray || catArray.length === 0) return <span>—</span>
        return <span>{catArray[0]?.name || '—'}</span>
      },
    }),
  ]

  return (
    <section>
      {/* Header */}
      <div className="p-4 bg-white shadow flex items-center justify-between sticky top-0 z-10">
        <h2 className="font-semibold text-lg text-gray-800">Sub Category</h2>
        <button
          onClick={() => setOpenAddSubCategory(true)}
          className="border-2 border-amber-500 text-amber-500 px-4 py-1.5 rounded-lg font-medium transition-all duration-300 hover:bg-amber-500 hover:text-white hover:shadow-md"
        >
          Add Sub Category
        </button>
      </div>

      {loading && (
        <Loading/>
      )}

      {/* Table */}
      <div>
        <DisplayTable
          data={data}
          columns={columns}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Add Subcategory Modal */}
      {openAddSubCategory && (
        <UploadSubCategoryModel
          close={() => setOpenAddSubCategory(false)}
          onSuccess={fetchSubCategory}
        />
      )}

      {/* View Image Modal */}
      {ImageURL && <ViewImage url={ImageURL} close={() => setImageURL("")} />}

      {/* Edit Subcategory Modal */}
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
          cancel={() => setOpenDeleteConfirmBox(false)}
          close={() => setOpenDeleteConfirmBox(false)}
          confirm={handleDeleteSubCategory}
        />
      )}
    </section>
  )
}

export default SubCategoryPage
