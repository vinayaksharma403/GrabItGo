import React, { useState } from "react";
import { DisplayPriceInRupees } from "../utils/DisplayPriceInRupees";
import { Link } from "react-router-dom";
import { validURLConvert } from "../utils/validURLConver";
import Axios from "../utils/axios";
import SummaryApi from "../common/SummaryApi";
import AxiosToastError from "../utils/AxiosToastError";
import { useDispatch, useSelector } from "react-redux";
import { updateCart } from "../store/userSlice";
import toast from "react-hot-toast";

const CardProduct = ({ data }) => {
    const url = `/product/${validURLConvert(data.name)}-${data._id}`
    const dispatch = useDispatch()
    const user = useSelector(state => state.user)
    const [loading, setLoading] = useState(false)

    const handleAddToCart = async (e) => {
      e.preventDefault()
      e.stopPropagation()

      if (!user._id) {
        toast.error("Please login to add to cart")
        return
      }

      try {
        setLoading(true)
        const response = await Axios({
          ...SummaryApi.addToCart,
          data: { productId: data._id, quantity: 1 }
        })
        const { data: responseData } = response
        if (responseData.success) {
          toast.success("Added to cart")
          // Optionally update cart in state
          // dispatch(updateCart(responseData.data.shopping_cart))
        }
      } catch (error) {
        AxiosToastError(error)
      } finally {
        setLoading(false)
      }
    }

  return (
    <Link to={url} className="border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer bg-white w-[180px]">
      {/* Product Image */}
      <div className="h-32 w-full flex items-center justify-center mb-3 bg-gray-50 rounded-xl overflow-hidden">
        <img
          src={data.image[0]}
          alt={data.name}
          className="object-contain w-full h-full transition-transform duration-300 hover:scale-105"
        />
      </div>

      {/* Delivery Tag */}
      <div className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full w-fit mb-2">
        10 min
      </div>

      {/* Product Name */}
      <h3 className="text-sm font-medium text-gray-800 leading-tight mb-1 truncate">
        {data.name}
      </h3>

      {/* Unit */}
      <p className="text-xs text-gray-500 mb-2">{data.unit}</p>

      {/* Price & Add Button */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-semibold text-gray-800">
          {DisplayPriceInRupees(data.price)}
        </span>
        <button
          onClick={handleAddToCart}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </div>
    </Link>
  );
};

export default CardProduct;
