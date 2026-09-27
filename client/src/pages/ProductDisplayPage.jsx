import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import SummaryApi from "../common/SummaryApi";
import Axios from "../utils/axios";
import AxiosToastError from "../utils/AxiosToastError";
import { DisplayPriceInRupees } from "../utils/DisplayPriceInRupees";
import toast from "react-hot-toast";
import NoData from "../components/NoData";
import {
  FiHome,
  FiChevronRight,
  FiArrowLeft,
  FiTruck,
  FiShield,
  FiCheckCircle,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiCreditCard
} from "react-icons/fi";
import { LuPackage } from "react-icons/lu";
import { useGlobalContext } from "../provider/GlobalContext";

const ProductDisplayPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useSelector((state) => state.user?._id);
  const { fetchCart, fetchAddress } = useGlobalContext() || {};
  const isSubmittingRef = useRef(false);

  // Robust product ID extraction from URL parameter
  const rawParam = params?.product || "";
  const extractProductId = (param) => {
    if (!param) return "";
    // If param is already a direct 24-character hex ID
    if (/^[0-9a-fA-F]{24}$/.test(param)) {
      return param;
    }
    // Match 24-char hex ID at the end of the slug
    const hexMatch = param.match(/([0-9a-fA-F]{24})$/);
    if (hexMatch) {
      return hexMatch[1];
    }
    // Fallback: take the final segment after the last hyphen
    const segments = param.split("-");
    return segments[segments.length - 1] || param;
  };
  const productId = extractProductId(rawParam);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [btnLoading, setBtnLoading] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [activeImg, setActiveImg] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const fetchProductDetails = useCallback(async () => {
    if (!productId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await Axios.get(`${SummaryApi.getProductDetails}/${productId}`);
      const { data: responseData } = response;

      if (responseData.success && responseData.data) {
        setData(responseData.data);
        setActiveImg(responseData.data?.image?.[0] || null);
        setImgError(false);
      } else {
        setError("Product not found");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load product details");
      AxiosToastError(err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  const isOutOfStock = !data?.stock || Number(data.stock) < 1;
  const maxStock = data?.stock ? Number(data.stock) : 0;

  const handleIncrement = () => {
    if (maxStock > 0 && quantity >= maxStock) {
      toast.error(`Only ${maxStock} items available in stock`);
      return;
    }
    setQuantity((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleAddToCart = async () => {
    if (isSubmittingRef.current || btnLoading || buyNowLoading) return;

    if (!userId) {
      toast.error("Please login to add items to your cart");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (isOutOfStock) {
      toast.error("Product is currently out of stock");
      return;
    }

    try {
      isSubmittingRef.current = true;
      setBtnLoading(true);
      const response = await Axios({
        ...SummaryApi.addToCart,
        data: { productId: data._id, quantity },
      });
      if (response.data.success) {
        toast.success(
          quantity > 1 ? `Added ${quantity} items to cart` : "Added to cart"
        );
        if (fetchCart) {
          await fetchCart();
        }
      }
    } catch (err) {
      AxiosToastError(err);
    } finally {
      setBtnLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleBuyNow = async () => {
    if (isSubmittingRef.current || btnLoading || buyNowLoading) return;

    if (!userId) {
      toast.error("Please login to proceed to checkout");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (isOutOfStock) {
      toast.error("Product is currently out of stock");
      return;
    }

    try {
      isSubmittingRef.current = true;
      setBuyNowLoading(true);
      const response = await Axios({
        ...SummaryApi.addToCart,
        data: { productId: data._id, quantity },
      });
      if (response.data.success) {
        if (fetchCart) {
          await fetchCart();
        }
        if (fetchAddress) {
          await fetchAddress();
        }
        navigate("/cart", { state: { autoCheckout: true } });
      }
    } catch (err) {
      AxiosToastError(err);
    } finally {
      setBuyNowLoading(false);
      isSubmittingRef.current = false;
    }
  };


  // Loading Skeleton State
  if (loading) {
    return (
      <section className="px-3 sm:px-6 md:px-8 py-6 bg-surface-50 min-h-[calc(100vh-80px)]">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb skeleton */}
          <div className="h-4 bg-surface-200 rounded w-48 mb-6 animate-pulse" />

          <div className="bg-white rounded-card shadow-subtle border border-surface-border p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
            {/* Gallery Skeleton */}
            <div className="lg:col-span-6 flex flex-col items-center gap-4">
              <div className="w-full aspect-square max-w-md bg-surface-100 rounded-card" />
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-surface-100 rounded-xl" />
                <div className="w-16 h-16 bg-surface-100 rounded-xl" />
                <div className="w-16 h-16 bg-surface-100 rounded-xl" />
              </div>
            </div>

            {/* Info Skeleton */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="h-8 bg-surface-100 rounded w-3/4" />
              <div className="h-4 bg-surface-100 rounded w-1/4" />
              <div className="h-10 bg-surface-100 rounded w-1/3 mt-2" />
              <div className="h-20 bg-surface-100 rounded w-full mt-2" />
              <div className="h-12 bg-surface-100 rounded w-full mt-4" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Not Found / Error State
  if (error || !data) {
    return (
      <section className="px-3 sm:px-6 py-12 bg-surface-50 min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="bg-white rounded-card border border-surface-border p-8 max-w-lg w-full text-center shadow-subtle">
          <NoData
            title="Product Unavailable"
            description={error || "The product you requested could not be found."}
            actionText="Browse All Products"
            actionHref="/"
          />
        </div>
      </section>
    );
  }

  const hasImage = Boolean(activeImg || data?.image?.[0]) && !imgError;
  const currentImageSrc = activeImg || data?.image?.[0];

  return (
    <section className="px-3 sm:px-6 md:px-8 py-5 sm:py-7 bg-surface-50 min-h-[calc(100vh-80px)]">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb & Navigation Bar */}
        <div className="flex items-center justify-between gap-3 mb-4 text-xs font-medium text-surface-muted flex-wrap">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="inline-flex items-center gap-1 hover:text-brand-600 transition-colors p-0.5">
              <FiHome size={13} />
              <span>Home</span>
            </Link>
            <FiChevronRight size={13} className="text-surface-muted/60" />
            <span>Products</span>
            <FiChevronRight size={13} className="text-surface-muted/60" />
            <span className="font-semibold text-surface-title line-clamp-1 max-w-[200px] sm:max-w-xs">
              {data.name}
            </span>
          </nav>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-xs text-surface-muted hover:text-surface-title hover:bg-white px-2.5 py-1 rounded-control border border-transparent hover:border-surface-border transition-colors cursor-pointer"
          >
            <FiArrowLeft size={14} />
            <span>Back</span>
          </button>
        </div>

        {/* Main Product Card Container */}
        <div className="bg-white rounded-card shadow-subtle border border-surface-border p-5 sm:p-8 lg:p-10 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* LEFT COLUMN: Gallery */}
            <div className="lg:col-span-6 flex flex-col items-center">
              {/* Primary Image Frame */}
              <div className="w-full aspect-square max-w-md bg-surface-50 rounded-card border border-surface-border flex items-center justify-center p-4 sm:p-6 overflow-hidden relative shadow-subtle group">
                {hasImage ? (
                  <img
                    src={currentImageSrc}
                    alt={data?.name || "Product Image"}
                    onError={() => setImgError(true)}
                    className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
                    fetchPriority="high"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-surface-muted p-6 text-center">
                    <LuPackage size={48} className="text-surface-muted/60 mb-2" />
                    <span className="text-xs font-semibold text-surface-muted">Image Not Available</span>
                  </div>
                )}

                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                  <span className="badge-brand text-xs font-bold px-2.5 py-1 shadow-subtle flex items-center gap-1">
                    ⚡ Fast Delivery
                  </span>
                  {Number(data?.discount) > 0 && (
                    <span className="badge-accent text-xs font-bold px-2.5 py-1 shadow-subtle">
                      {data.discount}% OFF
                    </span>
                  )}
                </div>

                {isOutOfStock && (
                  <span className="absolute top-3 right-3 badge-error text-xs font-bold px-2.5 py-1 shadow-subtle">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Thumbnails Strip (When multiple images exist) */}
              {Array.isArray(data?.image) && data.image.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto scrollbar-hide py-1 px-1 w-full justify-center">
                  {data.image.map((img, index) =>
                    img ? (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setActiveImg(img);
                          setImgError(false);
                        }}
                        aria-label={`View image ${index + 1}`}
                        className={`w-16 h-16 rounded-xl border-2 p-1 bg-surface-50 transition-all cursor-pointer overflow-hidden ${
                          currentImageSrc === img
                            ? "border-brand-600 ring-2 ring-brand-500/20 shadow-xs scale-105"
                            : "border-surface-border hover:border-surface-300"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          loading="lazy"
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ) : null
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Information & Purchase Controls */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <div>
                {/* Brand or Category Label */}
                {data?.brand && (
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-1 block">
                    {data.brand}
                  </span>
                )}

                {/* Product Title */}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-surface-title tracking-tight leading-snug mb-2">
                  {data?.name}
                </h1>

                {/* Unit / Variant */}
                {data?.unit && (
                  <p className="text-xs sm:text-sm text-surface-muted font-medium mb-4">
                    Unit: <span className="text-surface-title font-semibold">{data.unit}</span>
                  </p>
                )}

                {/* Price Display */}
                <div className="bg-surface-50/80 border border-surface-border/80 rounded-card p-4 mb-5">
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl sm:text-3xl font-extrabold text-surface-title tracking-tight">
                      {DisplayPriceInRupees(data?.price || 0)}
                    </span>
                    {Number(data?.discount) > 0 && (
                      <span className="badge-accent text-xs font-bold px-2 py-0.5">
                        Special Offer ({data.discount}% OFF)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-surface-muted mt-1">
                    Inclusive of all applicable taxes • Fast delivery
                  </p>
                </div>

                {/* Stock Status Indicator */}
                <div className="mb-5 flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      !isOutOfStock ? "bg-brand-500 animate-pulse" : "bg-rose-500"
                    }`}
                  />
                  <span
                    className={`text-xs sm:text-sm font-semibold ${
                      !isOutOfStock ? "text-brand-700" : "text-rose-600"
                    }`}
                  >
                    {!isOutOfStock
                      ? `In Stock (${data.stock} units available)`
                      : "Currently Out of Stock"}
                  </span>
                </div>

                {/* Quantity Selector */}
                {!isOutOfStock && (
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-xs sm:text-sm font-semibold text-surface-title">
                      Quantity:
                    </span>
                    <div className="inline-flex items-center border border-surface-border rounded-control bg-white shadow-subtle overflow-hidden">
                      <button
                        type="button"
                        onClick={handleDecrement}
                        disabled={quantity <= 1 || btnLoading || buyNowLoading}
                        aria-label="Decrease quantity"
                        className="p-2.5 text-surface-title hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                      >
                        <FiMinus size={14} />
                      </button>
                      <span className="px-4 text-sm font-bold text-surface-title select-none min-w-[32px] text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={handleIncrement}
                        disabled={
                          (maxStock > 0 && quantity >= maxStock) ||
                          btnLoading ||
                          buyNowLoading
                        }
                        aria-label="Increase quantity"
                        className="p-2.5 text-surface-title hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Purchase Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={btnLoading || buyNowLoading || isOutOfStock}
                    aria-label={`Add ${quantity} of ${data?.name || "product"} to cart`}
                    className="btn-primary flex-1 py-3 px-5 text-sm sm:text-base font-semibold shadow-card flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {btnLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <FiShoppingBag size={18} />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={btnLoading || buyNowLoading || isOutOfStock}
                    aria-label={`Buy ${data?.name || "product"} now`}
                    className="btn-accent flex-1 py-3 px-5 text-sm sm:text-base font-semibold shadow-card flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {buyNowLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <FiCreditCard size={18} />
                        <span>Buy Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Service & Delivery Trust Bar */}
              <div className="mt-8 pt-5 border-t border-surface-border/70 grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-1">
                    <FiTruck size={15} />
                  </div>
                  <span className="text-[11px] font-semibold text-surface-title">Fast Delivery</span>
                  <span className="text-[10px] text-surface-muted">Direct from local hub</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center mb-1">
                    <FiCheckCircle size={15} />
                  </div>
                  <span className="text-[11px] font-semibold text-surface-title">Quality Checked</span>
                  <span className="text-[10px] text-surface-muted">Handpicked selection</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-1">
                    <FiShield size={15} />
                  </div>
                  <span className="text-[11px] font-semibold text-surface-title">Stripe Secured</span>
                  <span className="text-[10px] text-surface-muted">Encrypted payments</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LOWER SECTION: Product Description & Details */}
        <div className="bg-white rounded-card shadow-subtle border border-surface-border p-5 sm:p-8">
          <h2 className="text-base sm:text-lg font-bold text-surface-title tracking-tight mb-3">
            Product Information
          </h2>

          {data?.description ? (
            <p className="text-surface-body text-xs sm:text-sm leading-relaxed mb-6 whitespace-pre-line">
              {data.description}
            </p>
          ) : (
            <p className="text-surface-muted text-xs sm:text-sm italic mb-6">
              No detailed description provided for this item.
            </p>
          )}

          {/* Specifications Grid */}
          <div className="border-t border-surface-border/60 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-muted mb-3">
              Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-surface-50 border border-surface-border/70 rounded-control p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-surface-muted block">
                  Unit / Weight
                </span>
                <span className="text-xs sm:text-sm font-semibold text-surface-title mt-0.5 block">
                  {data?.unit || "Standard Unit"}
                </span>
              </div>

              {data?.brand && (
                <div className="bg-surface-50 border border-surface-border/70 rounded-control p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-surface-muted block">
                    Brand
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-surface-title mt-0.5 block">
                    {data.brand}
                  </span>
                </div>
              )}

              <div className="bg-surface-50 border border-surface-border/70 rounded-control p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-surface-muted block">
                  Fulfillment
                </span>
                <span className="text-xs sm:text-sm font-semibold text-brand-700 mt-0.5 block">
                  GrabItGo Local Dispatch
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDisplayPage;
