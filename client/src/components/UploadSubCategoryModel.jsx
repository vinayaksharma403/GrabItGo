import React, { useState, useRef, useEffect } from 'react'
import { IoClose, IoChevronDown } from 'react-icons/io5'
import { useSelector } from 'react-redux'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'

const UploadSubCategoryModel = ({ close, onSuccess }) => {
  const [subCategoryData, setSubCategoryData] = useState({
    name: "",
    image: "",
    category: []
  })

  const allCategory = useSelector(state => state.product.allCategory)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const toggleDropdown = () => setDropdownOpen(prev => !prev)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ✅ Handle category selection (keeps full object)
  const handleCategoryToggle = (catObj) => {
    setSubCategoryData(prev => {
      const exists = prev.category.some(c => c._id === catObj._id)
      const updatedCategories = exists
        ? prev.category.filter(c => c._id !== catObj._id)
        : [...prev.category, catObj]
      return { ...prev, category: updatedCategories }
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setSubCategoryData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSubCategoryData(prev => ({ ...prev, image: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageRemove = () => {
    setSubCategoryData(prev => ({ ...prev, image: "" }))
  }

  // ✅ Backend submission logic
  const handleSubmitSubCategory = async (e) => {
    e.preventDefault()
    try {
      console.log("Submitting SubCategory Data:", subCategoryData)

      const response = await Axios({
        ...SummaryApi.createSubCategory,
        data: subCategoryData
      })

      const { data: responseData } = response
      if (responseData.success) {
        toast.success(responseData.message)
        
        // ✅ Trigger refresh in parent (SubCategoryPage)
        if (onSuccess) onSuccess()

        // ✅ Close modal
        if (close) close()
      } else {
        toast.error(responseData.message || "Failed to add subcategory")
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  return (
    <section className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 relative animate-fadeIn">

        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h1 className="text-lg font-semibold text-gray-800">Add Sub Category</h1>
          <button
            onClick={close}
            className="text-gray-500 hover:text-red-500 transition-colors duration-200 cursor-pointer"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmitSubCategory}>
          {/* Name Input */}
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">Name</label>
            <input
              id="name"
              name="name"
              value={subCategoryData.name}
              onChange={handleChange}
              type="text"
              placeholder="Enter subcategory name"
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Add Image</p>
            <label
              htmlFor="uploadImage"
              className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-amber-400 rounded-lg py-6 bg-amber-50 hover:bg-amber-100 transition duration-200"
            >
              {!subCategoryData.image ? (
                <>
                  <p className="text-gray-600 text-sm">Click to upload or drag & drop</p>
                  <input
                    type="file"
                    id="uploadImage"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </>
              ) : (
                <div className="relative w-32 h-32">
                  <img
                    src={subCategoryData.image}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg shadow"
                  />
                  <button
                    type="button"
                    onClick={handleImageRemove}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <IoClose size={16} />
                  </button>
                </div>
              )}
            </label>
          </div>

          {/* Multi-Select Dropdown */}
          <div className="grid gap-2 relative" ref={dropdownRef}>
            <label className="text-sm font-medium text-gray-700">Select Category</label>
            <div
              onClick={toggleDropdown}
              className="flex justify-between items-center border border-gray-300 rounded-lg px-3 py-2 bg-amber-50 cursor-pointer hover:bg-amber-100 transition"
            >
              <span className="text-gray-700 text-sm">
                {subCategoryData.category.length > 0
                  ? subCategoryData.category.map(c => c.name).join(", ")
                  : "Select category"}
              </span>
              <IoChevronDown className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </div>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-md mt-1 z-50 max-h-48 overflow-y-auto">
                {allCategory && allCategory.length > 0 ? (
                  allCategory.map(cat => (
                    <label
                      key={cat._id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-amber-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={subCategoryData.category.some(c => c._id === cat._id)}
                        onChange={() => handleCategoryToggle(cat)}
                        className="accent-amber-500"
                      />
                      <span className="text-gray-700 text-sm">{cat.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm px-3 py-2">No categories available</p>
                )}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={close}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 shadow"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default UploadSubCategoryModel
