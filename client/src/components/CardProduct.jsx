import React, { useState, memo } from "react";
import { DisplayPriceInRupees } from "../utils/DisplayPriceInRupees";
import { Link } from "react-router-dom";
import { validURLConvert } from "../utils/validURLConver";
import Axios from "../utils/axios";
import SummaryApi from "../common/SummaryApi";
import AxiosToastError from "../utils/AxiosToastError";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { LuPackage } from "react-icons/lu";

const CardProduct = ({ data }) => {
  const url = `/product/${validURLConvert(data?.name || "")}-${data?._id}`;
  const userId = useSelector((state) => state.user?._id);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isOutOfStock = data?.stock != null && Number(data.stock) < 1;
  const hasImage = Boolean(data?.image?.[0]) && !imgError;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      toast.error("Please login to add to cart");
      return;
    }

    if (isOutOfStock) {
      toast.error("Product is out of stock");
      return;
    }

    try {
      setLoading(true);
      const response = await Axios({
        ...SummaryApi.addToCart,
        data: { productId: data._id, quantity: 1 },
      });
      const { data: responseData } = response;
      if (responseData.success) {
        toast.success("Added to cart");
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link
      to={url}
      className="border border-surface-border rounded-card p-2.5 sm:p-3 shadow-subtle hover:shadow-card hover:-translate-y-1 transition-all duration-200 cursor-pointer bg-white w-full min-w-[140px] sm:min-w-[160px] md:max-w-[200px] flex flex-col justify-between group"
    >
      <div>
        {/* Product Image Frame */}
        <div className="h-28 sm:h-32 w-full flex items-center justify-center mb-2 sm:mb-2.5 bg-surface-50 rounded-xl overflow-hidden relative">
          {hasImage ? (
            <img
              src={data?.image?.[0]}
              alt={data?.name || "Product image"}
              loading="lazy"
              onError={() => setImgError(true)}
              className="object-contain w-full h-full p-1.5 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-surface-muted p-2">
              <LuPackage size={28} className="text-surface-muted/60 mb-1" />
              <span className="text-[10px] font-medium">No Image</span>
            </div>
          )}

          {/* Discount Badge if real discount exists */}
          {Number(data?.discount) > 0 && (
            <span className="absolute top-1.5 right-1.5 badge-accent text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
              {data.discount}% OFF
            </span>
          )}
        </div>

        {/* Availability / Delivery Tag */}
        <div className="flex items-center gap-1 mb-1.5">
          {isOutOfStock ? (
            <span className="badge-error text-[10px] font-semibold px-2 py-0.5 rounded-full">
              Out of stock
            </span>
          ) : (
            <div className="text-[10px] sm:text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100/80 px-2 py-0.5 rounded-full w-fit">
              10 min
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3 className="text-xs sm:text-sm font-semibold text-surface-title leading-tight mb-1 line-clamp-2 group-hover:text-brand-700 transition-colors">
          {data?.name}
        </h3>

        {/* Unit / Variant */}
        {data?.unit && (
          <p className="text-[11px] sm:text-xs text-surface-muted mb-2 line-clamp-1">
            {data.unit}
          </p>
        )}
      </div>

      {/* Price & Add Action Row */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-surface-border/60 gap-1">
        <span className="text-xs sm:text-sm font-bold text-surface-title">
          {DisplayPriceInRupees(data?.price || 0)}
        </span>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={loading || isOutOfStock}
          aria-label={
            isOutOfStock
              ? `${data?.name || "Product"} is out of stock`
              : `Add ${data?.name || "product"} to cart`
          }
          className="bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:bg-surface-200 disabled:text-surface-muted text-white text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-control shadow-subtle transition-all disabled:opacity-60 disabled:cursor-not-allowed min-h-[32px] flex items-center justify-center cursor-pointer"
        >
          {loading ? (
            <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isOutOfStock ? (
            "Out"
          ) : (
            "+ Add"
          )}
        </button>
      </div>
    </Link>
  );
};

export default memo(CardProduct);
