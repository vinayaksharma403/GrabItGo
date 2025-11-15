import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import uploadImage from "../utils/uploadImage";
import Axios from "../utils/axios";
import SummaryApi from "../common/SummaryApi";
import AxiosToastError from "../utils/AxiosToastError";
import { toast } from "react-hot-toast";

const EditProductAdmin = ({ close, productId, fetchData }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [originalData, setOriginalData] = useState(null);
  const [data, setData] = useState({
    _id: "",
    name: "",
    category: "",
    subcategory: "",
    unit: "",
    price: "",
    discount: "",
    stock: "",
    description: "",
    images: [],
  });

  /** Fetch categories & subcategories */
  const getCategoriesAndSubcategories = async () => {
    try {
      const [catResp, subResp] = await Promise.all([
        Axios(SummaryApi.getCategory),
        Axios(SummaryApi.getSubCategory),
      ]);

      if (catResp.data?.success) setCategories(catResp.data.data || []);
      if (subResp.data?.success) setSubcategories(subResp.data.data || []);
    } catch (err) {
      AxiosToastError(err);
    }
  };

  /** Fetch product details */
  const fetchProductDetails = async () => {
    if (!productId) return;
    try {
      const resp = await Axios.get(`${SummaryApi.getProductDetails}/${productId}`);
      const p = resp.data?.data || {};

      const formatted = {
        _id: p._id || "",
        name: p.name || "",
        category: p.category?._id || "",
        subcategory: p.subCategory?._id || "",
        unit: p.unit || "",
        price: p.price || "",
        discount: p.discount || "",
        stock: p.stock || "",
        description: p.description || "",
        images: p.image || [],
      };

      setData(formatted);
      setOriginalData(formatted);
    } catch (err) {
      AxiosToastError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCategoriesAndSubcategories();
    fetchProductDetails();
  }, [productId]);

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));

    // Reset subcategory if category changes
    if (name === "category") {
      setData((prev) => ({ ...prev, subcategory: "" }));
    }
  };

  const handleUploadImages = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSaving(true);
    try {
      const uploadedImages = [...(data.images || [])];
      for (let i = 0; i < files.length; i++) {
        const uploadResp = await uploadImage(files[i]);
        const url =
          uploadResp?.data?.data?.url ||
          uploadResp?.data?.url ||
          uploadResp?.data ||
          null;
        if (url) uploadedImages.push(url);
      }
      setData((prev) => ({ ...prev, images: uploadedImages }));
    } catch (err) {
      AxiosToastError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = (index) => {
    const copy = [...(data.images || [])];
    copy.splice(index, 1);
    setData((prev) => ({ ...prev, images: copy }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.name || !data.category || !data.subcategory) {
      toast.error("Please fill all required fields!");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...data,
        category: data.category,
        subCategory: data.subcategory,
      };

      const resp = await Axios({
        ...SummaryApi.updateProduct,
        data: payload,
      });

      if (resp.data?.success) {
        toast.success(resp.data.message || "Product updated successfully 🎉");
        fetchData && fetchData();
        close && close();
      } else {
        toast.error(resp.data?.message || "Update failed");
      }
    } catch (err) {
      AxiosToastError(err);
    } finally {
      setSaving(false);
    }
  };

  const isChanged = originalData && JSON.stringify(originalData) !== JSON.stringify(data);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded shadow">
          Loading product details...
        </div>
      </div>
    );
  }

  return (
    <section
      className="fixed inset-0 p-4 bg-neutral-800/60 flex items-center justify-center z-50 overflow-auto"
      onClick={close}
    >
      <div
        className="bg-white w-full max-w-3xl p-5 rounded-lg shadow-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
        >
          <IoClose size={28} />
        </button>

        <h1 className="text-xl font-semibold mb-4">Edit Product</h1>

        {/* Images */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {(data.images || []).map((img, idx) => (
            <div key={idx} className="relative w-28 h-28 border rounded">
              <img
                src={img}
                alt={`img-${idx}`}
                className="w-full h-full object-cover rounded"
              />
              <button
                type="button"
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                onClick={() => handleDeleteImage(idx)}
              >
                <IoClose size={14} />
              </button>
            </div>
          ))}
          <label className="w-28 h-28 border rounded flex items-center justify-center cursor-pointer bg-blue-50">
            {saving ? "..." : "+ Add"}
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleUploadImages}
            />
          </label>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name*</label>
            <input
              name="name"
              value={data.name}
              onChange={handleOnChange}
              className="w-full border p-2 rounded bg-blue-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category*</label>
              <select
                name="category"
                value={data.category}
                onChange={handleOnChange}
                className="w-full border p-2 rounded bg-blue-50"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subcategory*</label>
              <select
                name="subcategory"
                value={data.subcategory}
                onChange={handleOnChange}
                className="w-full border p-2 rounded bg-blue-50"
                disabled={!data.category}
              >
                <option value="">Select Subcategory</option>
                {subcategories
                  .filter((s) => s.category === data.category)
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <input
              name="unit"
              value={data.unit}
              onChange={handleOnChange}
              className="w-full border p-2 rounded bg-blue-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input
                name="price"
                type="number"
                value={data.price}
                onChange={handleOnChange}
                className="w-full border p-2 rounded bg-blue-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Stock</label>
              <input
                name="stock"
                type="number"
                value={data.stock}
                onChange={handleOnChange}
                className="w-full border p-2 rounded bg-blue-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Discount (%)</label>
            <input
              name="discount"
              type="number"
              value={data.discount}
              onChange={handleOnChange}
              className="w-full border p-2 rounded bg-blue-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              rows="3"
              value={data.description}
              onChange={handleOnChange}
              className="w-full border p-2 rounded bg-blue-50"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-2 rounded font-semibold text-white ${
              saving || !isChanged
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
            disabled={saving || !isChanged}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default EditProductAdmin;
