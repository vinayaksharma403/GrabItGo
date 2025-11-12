import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SummaryApi from "../common/SummaryApi";
import Axios from "../utils/axios";
import AxiosToastError from "../utils/AxiosToastError";
import Loading from "../components/Loading";

const ProductDisplayPage = () => {
  const params = useParams();
  const productId = params?.product?.split("-")?.slice(-1)[0];
  
  const [data, setData] = useState({
    name: "",
    image: [],
    price: "",
    description: "",
    brand: "",
    unit: "",
    stock: "",
  });
  const [loading, setLoading] = useState(false);
  const [activeImg, setActiveImg] = useState(null);

 const fetchProductDetails = async () => {
  try {
    setLoading(true);
    const response = await Axios.get(`${SummaryApi.getProductDetails}/${productId}`);
    const { data: responseData } = response;
    if (responseData.success) {
      setData(responseData.data);
      setActiveImg(responseData.data?.image?.[0] || null);
    }
  } catch (error) {
    AxiosToastError(error);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchProductDetails();
  }, [params]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loading />
      </div>
    );
  }

  return (
    <section className="relative top-24 lg:top-20 px-4 sm:px-6 md:px-10 py-8 bg-gray-50 min-h-screen">
      <div className="container mx-auto bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col lg:flex-row gap-10 p-6 transition-all duration-300 hover:shadow-xl">
        
        {/* LEFT: Product Images */}
        <div className="w-full lg:w-1/2 flex flex-col items-center">
          
          {/* Main Image */}
          <div className="w-full flex justify-center bg-gray-100 rounded-2xl overflow-hidden p-6 transition-all duration-300 hover:scale-[1.02]">
            {activeImg && (
              <img
                src={activeImg}
                alt={data?.name || "Product"}
                className="w-full max-w-md object-contain mix-blend-multiply transition-transform duration-500 hover:scale-105"
              />
            )}
          </div>

          {/* Scrollable Thumbnails */}
          {data?.image?.length > 1 && (
            <div className="flex gap-4 mt-4 overflow-x-auto scrollbar-thin scrollbar-thumb-[#22c55e] scrollbar-track-gray-100 py-2 px-1 w-full justify-start lg:justify-center">
              {data.image.map((img, index) =>
                img ? (
                  <div
                    key={index}
                    className={`border-2 rounded-xl min-w-[5rem] h-[5rem] flex items-center justify-center cursor-pointer transition-all duration-300 ${
                      activeImg === img
                        ? "border-[#22c55e] scale-105"
                        : "border-transparent hover:border-gray-300"
                    }`}
                    onClick={() => setActiveImg(img)}
                  >
                    <img
                      src={img}
                      alt={`thumb-${index}`}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Product Info */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 capitalize tracking-tight">
            {data?.name || "Product Name"}
          </h1>

          {data?.brand && (
            <p className="text-gray-500 text-sm sm:text-base">
              <span className="font-medium text-gray-700">Brand:</span> {data.brand}
            </p>
          )}

          <p className="text-[#22c55e] text-3xl font-semibold mt-2">
            ₹{data?.price || "—"}
            <span className="text-gray-500 text-sm font-normal ml-1">
              / {data?.unit || "unit"}
            </span>
          </p>

          {data?.description && (
            <p className="text-gray-600 leading-relaxed mt-2 text-sm sm:text-base">
              {data.description}
            </p>
          )}

          <p
            className={`text-sm font-medium mt-2 ${
              data?.stock > 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {data?.stock > 0 ? "In Stock" : "Out of Stock"}
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4 mt-6">
            <button className="bg-[#22c55e] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#16a34a] active:scale-95 transition-all duration-300 shadow-md hover:shadow-[#22c55e]/40">
              Add to Cart
            </button>
            <button className="border border-[#22c55e] text-[#22c55e] px-6 py-3 rounded-xl font-semibold hover:bg-[#22c55e] hover:text-white active:scale-95 transition-all duration-300 shadow-md hover:shadow-[#22c55e]/30">
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDisplayPage;
