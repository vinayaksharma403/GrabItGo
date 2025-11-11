import React, { useState } from "react";

const ProductCardAdmin = ({ data }) => {
  const [currentImage, setCurrentImage] = useState(0);

  return (
    <div className="group bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Product Image */}
      <div className="relative w-full h-48 bg-gray-50 flex items-center justify-center">
        <img
          src={data?.image?.[currentImage]}
          alt={data?.name}
          className="w-full h-full object-contain p-3 transition-all duration-300 group-hover:scale-105"
        />

        {/* Image switcher if multiple images */}
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
                } transition-all`}
              ></button>
            ))}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 text-center">
        <h3 className="text-gray-800 font-semibold text-base truncate">
          {data?.name || "Unnamed Product"}
        </h3>
        <p className="text-gray-500 text-sm mt-1">{data?.unit || "—"}</p>

        {/* Optional stock/price preview for admin */}
        {data?.price && (
          <p className="text-amber-600 font-medium mt-2">
            ₹{data.price}
            {data?.discount > 0 && (
              <span className="text-gray-400 text-sm line-through ml-2">
                ₹{(data.price / (1 - data.discount / 100)).toFixed(0)}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCardAdmin;
