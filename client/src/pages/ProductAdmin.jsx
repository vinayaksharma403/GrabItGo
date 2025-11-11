import React, { useState, useEffect } from "react";
import SummaryApi from "../common/SummaryApi";
import AxiosToastError from "../utils/AxiosToastError";
import Axios from "../utils/axios";
import Loading from "../components/Loading";
import ProductCardAdmin from "../components/ProductCardAdmin";

const ProductAdmin = () => {
  const [productData, setProductData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const response = await Axios({
        ...SummaryApi.getProduct,
        data: { page, search: searchQuery.trim() },
      });

      const { data: responseData } = response;
      if (responseData.success) {
        setProductData(responseData.data);
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [page, searchQuery]);

  console.log("product data", productData);

  return (
    <section className="min-h-screen bg-gray-50">
      {/* Header with Search */}
      <div className="p-4 bg-white shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-10">
        <h2 className="font-semibold text-lg text-gray-800">Product</h2>

        <div className="relative w-full sm:w-1/3">
          <input
            type="text"
            placeholder="Search product here..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-gray-400 text-gray-700 transition-all duration-200"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute right-3 top-2.5 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && <Loading />}

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
        {productData.map((p, index) => (
          <ProductCardAdmin key={index} data={p} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-6 bg-gray-50 border-t mt-4">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className={`px-5 py-2 rounded-md border border-amber-400 text-gray-700 font-medium transition-all duration-200 
          ${
            page === 1
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-amber-500 hover:text-white hover:border-amber-500 shadow-sm"
          }`}
        >
          Previous
        </button>

        <span className="text-gray-600 font-medium">{page}/48</span>

        <button
          onClick={() => setPage((prev) => prev + 1)}
          className="px-5 py-2 rounded-md border border-amber-400 text-gray-700 font-medium transition-all duration-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 shadow-sm"
        >
          Next
        </button>
      </div>
    </section>
  );
};

export default ProductAdmin;
