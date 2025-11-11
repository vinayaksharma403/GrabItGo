import React, { useState } from 'react'
import UploadCategoryModel from '../components/UploadCategoryModel'
import { useEffect } from 'react'
import Loading from '../components/Loading'
import NoData from '../components/NoData'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import EditCategory from '../components/EditCategory'
import ConfirmBox from '../components/ConfirmBox'
import AxiosToastError from '../utils/AxiosToastError'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'


const CategoryPage = () => {
  const [openUploadCategory, setOpenUploadCategory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categoryData, setCategoryData] = useState([])
  const [openEdit, setOpenEdit] = useState(false)
  const [editData, setEditData] = useState({
    name: "",
    image: ""
  })
  const [openConfirmBoxDelete, setOpenConfirmBoxDelete] = useState(false)
  const [deleteCategory, setDeleteCategory] = useState({
    _id: ""
  })

  // const allCategory = useSelector(state => state.product.allCategory)

  // useEffect(()=>{
  //   setCategoryData(allCategory)
  // },[allCategory])

  const fetchCategory = async () => {
    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.getCategory
      })
      const { data: responseData } = response

      if (responseData.success) {
        setCategoryData(responseData.data)
      }

    } catch (error) {

    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategory()

  }, [])

  const handleDeleteCategory = async() => {
    try {
      const response = await Axios({
       ...SummaryApi.deleteCategory,
       data : deleteCategory,
      })
      const {data : responseData} = response

      if(responseData.success){
        toast.success(responseData.message)
        // fetchCategory()
        setOpenConfirmBoxDelete(false)
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  return (
    <section className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white shadow flex items-center justify-between sticky top-0 z-10">
        <h2 className="font-semibold text-lg text-gray-800">Category</h2>
        <button
          onClick={() => setOpenUploadCategory(true)}
          className="border-2 border-amber-500 text-amber-500 px-4 py-1.5 rounded-lg font-medium transition-all duration-300 hover:bg-amber-500 hover:text-white hover:shadow-md"
        >
          Add Category
        </button>
      </div>

      {/* Category Grid */}
      <div className="p-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {categoryData.map((category, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200"
          >
            <img
              src={category.image}
              alt={category.name}
              className="w-full h-40 object-contain p-4"
            />

            <div className="p-3 text-center">
              <p className="font-medium text-gray-800">{category.name}</p>
            </div>

            <div className='items-center h-9 flex gap-2'>
              <button onClick={() => {
                setOpenEdit(true)
                setEditData(category)
              }} className='flex-1 bg-green-100 hover:bg-green-200 text-green-600 font-medium py-1 rounded cursor-pointer'>Edit</button>
              <button onClick={() => { 
                setOpenConfirmBoxDelete(true)
                setDeleteCategory(category)

               }} className='flex-1 bg-red-100 hover:bg-red-200 text-red-600 font-medium py-1 rounded cursor-pointer'>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Loading / Modal */}
      {loading && <Loading />}
      {openUploadCategory && (
        <UploadCategoryModel close={() => setOpenUploadCategory(false)} />
      )}
      {
        openEdit && (
          <EditCategory data={editData} close={() => setOpenEdit(false)}  />
        )
      }
      {
        openConfirmBoxDelete && (
          <ConfirmBox close={() => setOpenConfirmBoxDelete(false)} cancel={() => setOpenConfirmBoxDelete(false)} confirm={handleDeleteCategory} />
        )
      }
    </section>

  )
}

export default CategoryPage
