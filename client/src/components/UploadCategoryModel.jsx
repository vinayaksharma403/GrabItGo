import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import uploadImage from "../utils/uploadImage";
import Axios from "../utils/axios";
import SummaryApi from "../common/SummaryApi";
import AxiosToastError from "../utils/AxiosToastError";
import { toast } from "react-hot-toast";

const UploadCategoryModel = ({ close, fetchData }) => {
  const [data, setData] = useState({ name: "", image: "" });
  const [loading, setLoading] = useState(false);

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await Axios({ ...SummaryApi.addCategory, data });
      const { data: responseData } = response;

      if (responseData.success) {
        toast.success(responseData.message);
        close();
        fetchData();
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCategoryImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const response = await uploadImage(file);
    const { data: ImageResponse } = response;

    setData((prev) => ({ ...prev, image: ImageResponse.data.url }));
  };

  return (
    <section className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-lg p-6 animate-fadeIn relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h1 className="text-lg font-semibold text-gray-800">
            Add Category
          </h1>
          <button
            onClick={close}
            className="text-gray-500 hover:text-red-500 transition-colors duration-200"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Category Name */}
          <div className="grid gap-2">
            <label
              htmlFor="categoryName"
              className="text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              id="categoryName"
              name="name"
              value={data.name}
              onChange={handleOnChange}
              placeholder="Enter category name"
              type="text"
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50"
            />
          </div>

          {/* Image Upload */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Upload Image
            </label>
            <div className="flex flex-col lg:flex-row items-center gap-4">
              {/* Preview */}
              <div className="h-36 w-full lg:w-36 bg-amber-50 border-2 border-dashed border-amber-300 flex items-center justify-center rounded-lg overflow-hidden">
                {data.image ? (
                  <img
                    src={data.image}
                    alt="category"
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <p className="text-sm text-gray-500">No Image</p>
                )}
              </div>

              {/* Upload Button */}
              <label htmlFor="uploadCategoryImage">
                <div
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                    !data.name
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-amber-500 text-amber-600 cursor-pointer hover:bg-amber-500 hover:text-white shadow"
                  }`}
                >
                  {loading ? "Uploading..." : "Upload Image"}
                </div>
                <input
                  type="file"
                  id="uploadCategoryImage"
                  disabled={!data.name}
                  onChange={handleUploadCategoryImage}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              disabled={!data.name || !data.image}
              className={`px-6 py-2 text-sm font-semibold rounded-lg shadow transition-all duration-200 ${
                data.name && data.image
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? "Saving..." : "Add Category"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default UploadCategoryModel;
