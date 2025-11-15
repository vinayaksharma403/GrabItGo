import React, { useState } from "react";
import EditProductAdmin from "./EditProductAdmin";
import Axios from "../utils/axios";
import SummaryApi from "../common/SummaryApi";
import AxiosToastError from "../utils/AxiosToastError";
import { toast } from "react-hot-toast";

const ProductCardAdmin = ({ data, fetchData }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [editOpen, setEditOpen] = useState(false);

  // ---- TOAST CONFIRMATION ----
  const confirmDelete = () => {
    toast(
      (t) => (
        <div className="text-center">
          <p className="font-semibold text-gray-800 mb-2">
            Delete this product?
          </p>

          <div className="flex items-center justify-center gap-3">
            {/* YES BUTTON */}
            <button
              onClick={() => {
                toast.dismiss(t.id);
                handleDelete();
              }}
              className="px-3 py-1 bg-red-500 text-white rounded-md text-sm"
            >
              Yes
            </button>

            {/* NO BUTTON */}
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-300 text-gray-800 rounded-md text-sm"
            >
              No
            </button>
          </div>
        </div>
      ),
      { duration: 6000 }
    );
  };

  // ---- DELETE FUNCTION ----
  const handleDelete = async () => {
  try {
    const res = await Axios({
      method: "DELETE",
      url: SummaryApi.deleteProductDetails.url,
      params: { _id: data._id }, // ✔ send id in query
    });

    if (res.data.success) {
      toast.success("Product deleted successfully ✔");
      fetchData();
    }
  } catch (err) {
    AxiosToastError(err);
  }
};


  return (
    <div className="group bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      
      {/* Image */}
      <div className="relative w-full h-48 bg-gray-50 flex items-center justify-center">
        <img
          src={data?.image?.[currentImage]}
          alt={data?.name}
          className="w-full h-full object-contain p-3 transition-all duration-300 group-hover:scale-105"
        />

        {/* Image Dots */}
        {data?.image?.length > 1 && (
          <div className="absolute bottom-2 flex justify-center gap-2 w-full">
            {data.image.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImage(idx)}
                className={`w-2.5 h-2.5 rounded-full ${
                  currentImage === idx
                    ? "bg-amber-500"
                    : "bg-gray-300 hover:bg-amber-300"
                }`}
              ></button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4 text-center">
        <h3 className="text-gray-800 font-semibold text-base truncate">
          {data?.name}
        </h3>

        <p className="text-gray-500 text-sm mt-1">{data?.unit}</p>

        {data?.price && (
          <p className="text-amber-600 font-medium mt-2">
            ₹{data.price}
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="px-4 pb-4 flex items-center justify-between gap-3">
        <button
          onClick={() => setEditOpen(true)}
          className="flex-1 bg-amber-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-amber-600"
        >
          Edit
        </button>

        <button
          onClick={confirmDelete}
          className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-red-600"
        >
          Delete
        </button>
      </div>

      {editOpen && (
        <EditProductAdmin
          productId={data._id}
          close={() => setEditOpen(false)}
          fetchData={fetchData}
        />
      )}
    </div>
  );
};

export default ProductCardAdmin;
