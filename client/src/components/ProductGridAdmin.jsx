import React from "react";
import ProductCardAdmin from "./ProductCardAdmin";

const ProductGridAdmin = ({ products }) => {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        All Products
      </h2>

      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {products?.length > 0 ? (
          products.map((item) => (
            <ProductCardAdmin key={item._id} data={item} />
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">
            No products found
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductGridAdmin;
