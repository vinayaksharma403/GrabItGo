import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import AxiosToastError from "../utils/AxiosToastError";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import CardLoading from "./CardLoading";
import CardProduct from "./CardProduct";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CategoryWiseProductDisplay = ({ id, name }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const fetchCategoryWiseProduct = async () => {
    try {
      setLoading(true);
      const response = await Axios({
        ...SummaryApi.getProductByCategory,
        data: { id },
      });
      const { data: responseData } = response;
      if (responseData.success) setData(responseData.data);
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryWiseProduct();
  }, []);

  const loadingCardNumber = new Array(6).fill(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!loading && data.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full py-6 bg-white z-[1]">
      {/* Category Header */}
      <div className="container mx-auto px-4 flex items-center justify-between mb-3 bg-white shadow-sm">
        <h3 className="font-semibold text-lg md:text-xl text-gray-800">
          {name}
        </h3>
        <Link
          to=""
          className="text-green-600 hover:text-green-500 text-sm md:text-base font-medium"
        >
          See All
        </Link>
      </div>

      {/* Scrollable Product Row */}
      <div className="relative container mx-auto px-4 overflow-hidden z-[1]">
        {/* Left Scroll Button */}
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 bg-white border rounded-full shadow p-2 hover:bg-gray-100 z-[5]"
        >
          <ChevronLeft size={20} />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-2"
        >
          {loading
            ? loadingCardNumber.map((_, index) => (
                <CardLoading key={"CategoryWiseProductDisplay" + index} />
              ))
            : Array.isArray(data) &&
              data.map((p, index) => (
                <CardProduct
                  data={p}
                  key={p._id + "CategoryWiseProductDisplay" + index}
                />
              ))}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 bg-white border rounded-full shadow p-2 hover:bg-gray-100 z-[5]"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
};

export default CategoryWiseProductDisplay;
