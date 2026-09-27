import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import AxiosToastError from "../utils/AxiosToastError";
import Axios from "../utils/axios";
import SummaryApi from "../common/SummaryApi";
import CardLoading from "./CardLoading";
import CardProduct from "./CardProduct";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { validURLConvert } from "../utils/validURLConver";

const CategoryWiseProductDisplay = ({ id, name }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef(null);
  const sectionRef = useRef(null);

  const subCategoryData = useSelector((state) => state.product.allSubCategory);
  const matchingSubCategory = subCategoryData?.find((sub) =>
    sub?.category?.some((c) => (typeof c === "object" ? c?._id === id : c === id))
  );

  const seeAllUrl = matchingSubCategory
    ? `/${validURLConvert(name || "category")}-${id}/${validURLConvert(matchingSubCategory.name || "subcategory")}-${matchingSubCategory._id}`
    : "";

  const checkScrollability = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  const fetchCategoryWiseProduct = useCallback(async () => {
    if (!id || hasFetched) return;
    try {
      setLoading(true);
      const response = await Axios({
        ...SummaryApi.getProductByCategory,
        data: { id },
      });
      const { data: responseData } = response;
      if (responseData.success) {
        setData(responseData.data || []);
      }
      setHasFetched(true);
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  }, [id, hasFetched]);

  useEffect(() => {
    const currentElem = sectionRef.current;
    if (!currentElem || typeof IntersectionObserver === "undefined") {
      fetchCategoryWiseProduct();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          fetchCategoryWiseProduct();
          observer.disconnect();
        }
      },
      { rootMargin: "250px 0px" }
    );

    observer.observe(currentElem);

    return () => {
      observer.disconnect();
    };
  }, [fetchCategoryWiseProduct]);

  // Check scrollability on data update and window resize
  useEffect(() => {
    checkScrollability();
    window.addEventListener("resize", checkScrollability);
    return () => {
      window.removeEventListener("resize", checkScrollability);
    };
  }, [data, loading, checkScrollability]);

  const loadingCardNumber = new Array(6).fill(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkScrollability, 350);
    }
  };

  if (!loading && hasFetched && data.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className="relative w-full py-4 sm:py-5 z-[1]">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Category Header */}
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div>
            <h2 className="font-bold text-base sm:text-lg md:text-xl text-surface-title tracking-tight">
              {name}
            </h2>
            <p className="text-[11px] sm:text-xs text-surface-muted hidden sm:block">
              Fresh stock & daily grocery essentials
            </p>
          </div>

          {seeAllUrl ? (
            <Link
              to={seeAllUrl}
              aria-label={`See all products in ${name}`}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors group p-1"
            >
              <span>See All</span>
              <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <span className="text-xs sm:text-sm font-medium text-surface-muted">
              {data.length > 0 ? `${data.length} items` : ""}
            </span>
          )}
        </div>

        {/* Scrollable Product Row with intelligent controls */}
        <div className="relative group/row">
          {/* Left Scroll Button - only visible when actually scrollable */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label={`Scroll ${name} products left`}
              className="hidden md:flex items-center justify-center absolute -left-3 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm border border-surface-border text-surface-title rounded-full shadow-card p-2 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 z-[5] min-w-[38px] min-h-[38px] transition-all cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <div
            ref={scrollRef}
            onScroll={checkScrollability}
            className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth scrollbar-hide py-1 px-0.5"
          >
            {loading || (!hasFetched && data.length === 0)
              ? loadingCardNumber.map((_, index) => (
                  <div key={"CardLoading" + index} className="w-36 sm:w-44 flex-shrink-0">
                    <CardLoading />
                  </div>
                ))
              : Array.isArray(data) &&
                data.map((p, index) => (
                  <div key={p._id + "CategoryWiseProductDisplay" + index} className="w-36 sm:w-44 flex-shrink-0">
                    <CardProduct data={p} />
                  </div>
                ))}
          </div>

          {/* Right Scroll Button - only visible when actually scrollable */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label={`Scroll ${name} products right`}
              className="hidden md:flex items-center justify-center absolute -right-3 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm border border-surface-border text-surface-title rounded-full shadow-card p-2 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 z-[5] min-w-[38px] min-h-[38px] transition-all cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default memo(CategoryWiseProductDisplay);