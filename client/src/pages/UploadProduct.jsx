// ✅ Final Updated Code
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Axios from "../utils/axios";
import SummaryApi from "../common/SummaryApi";
import AxiosToastError from "../utils/AxiosToastError";
import Loading from "../components/Loading";
import { useSelector } from "react-redux";
import successAlert from "../utils/SuccessAlert";

const UploadProduct = () => {
  const [loading, setLoading] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);

  const allSubCategory = useSelector((state) => state.product.allSubCategory);

  const [data, setData] = useState({
    name: "",
    image: [],
    category: "",
    subCategory: "",
    unit: "",
    stock: "",
    price: "",
    discount: "",
    description: "",
    more_details: {},
  });

  // 🟡 Handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  // 🟡 Handle multiple image uploads (append instead of replace)
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    // Convert to Base64
    const base64Images = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
          })
      )
    );

    // Append new images instead of replacing
    setData((prev) => ({
      ...prev,
      image: [...prev.image, ...base64Images],
    }));

    // Reset input field
    e.target.value = "";
  };

  // 🟡 Fetch categories/subcategories async
  const fetchCategoryAndSubCategory = async () => {
    try {
      const [catRes, subCatRes] = await Promise.allSettled([
        Axios({ ...SummaryApi.getCategory }),
        Axios({ ...SummaryApi.getSubCategory }),
      ]);

      if (catRes.status === "fulfilled" && catRes.value.data.success)
        setCategoryList(catRes.value.data.data);
      if (subCatRes.status === "fulfilled" && subCatRes.value.data.success)
        setSubCategoryList(subCatRes.value.data.data);
    } catch (error) {
      AxiosToastError(error);
    }
  };

  useEffect(() => {
    fetchCategoryAndSubCategory();
  }, []);

  // 🟡 Handle product upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await Axios({
        ...SummaryApi.createProduct,
        data,
      });
      const { data: resData } = response;

      if (resData.success) {
        successAlert(resData.message || "Product uploaded successfully");
        setData({
          name: "",
          image: [],
          category: "",
          subCategory: "",
          unit: "",
          stock: "",
          price: "",
          discount: "",
          description: "",
          more_details: {},
        });
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-gray-50">
      <div className="p-4 bg-white shadow flex items-center justify-between sticky top-0 z-10">
        <h2 className="font-semibold text-lg text-gray-800">
          Upload Product
        </h2>
      </div>

      <div className="p-6">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 border border-gray-200 space-y-6 transition-all duration-200"
        >
          {/* Product Name */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              placeholder="Enter product name"
              name="name"
              value={data.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={data.category}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-400"
            >
              <option value="">Select Category</option>
              {categoryList.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Subcategory
            </label>
            <select
              name="subCategory"
              value={data.subCategory}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-400"
            >
              <option value="">Select Subcategory</option>
              {subCategoryList.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Unit, Stock, Price */}
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              name="unit"
              placeholder="Unit (e.g. 1kg)"
              value={data.unit}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 focus:ring-amber-400"
            />
            <input
              type="number"
              name="stock"
              placeholder="Stock"
              value={data.stock}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 focus:ring-amber-400"
            />
            <input
              type="number"
              name="price"
              placeholder="Price (₹)"
              value={data.price}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 focus:ring-amber-400"
            />
          </div>

          {/* Discount */}
          <input
            type="number"
            name="discount"
            placeholder="Discount (%)"
            value={data.discount}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-amber-400"
          />

          {/* Description */}
          <textarea
            name="description"
            placeholder="Enter product description"
            value={data.description}
            onChange={handleChange}
            rows="3"
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-amber-400"
          />

          {/* Image Upload */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Product Images
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-600 border border-gray-300 rounded-lg p-2 cursor-pointer"
            />
            {data.image.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {data.image.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img}
                      alt="preview"
                      className="w-24 h-24 object-cover border rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setData((prev) => ({
                          ...prev,
                          image: prev.image.filter((_, i) => i !== idx),
                        }))
                      }
                      className="absolute top-1 right-1 bg-black/70 text-white text-xs rounded-full px-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 rounded-lg transition-all duration-300 disabled:opacity-60"
          >
            {loading ? "Uploading..." : "Upload Product"}
          </button>
        </form>
      </div>

      {loading && <Loading />}
    </section>
  );
};

export default UploadProduct;
