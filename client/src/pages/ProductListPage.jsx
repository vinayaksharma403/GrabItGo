import React, { useEffect, useState } from "react";
import Axios from "../utils/axios";
import SummaryApi from "../common/SummaryApi";
import { useParams, useNavigate, Link } from "react-router-dom";
import AxiosToastError from "../utils/AxiosToastError";
import Loading from "../components/Loading";
import CardProduct from "../components/CardProduct";
import { useSelector } from "react-redux";
import { validURLConvert } from "../utils/validURLConver";

const ProductListPage = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalPage, setTotalPage] = useState(1);
  const params = useParams();
  const navigate = useNavigate();
  const AllSubCategory = useSelector((state) => state.product.allSubCategory);
  const [DisplaySubCategory, setDisplayCategory] = useState([]);

  const subCategory = params?.subCategory?.split("-");
  const subCategoryName = subCategory
    ?.slice(0, subCategory?.length - 1)
    ?.join(" ");

  const categoryId = params.category.split("-").slice(-1)[0];
  const subCategoryId = params.subCategory.split("-").slice(-1)[0];

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const response = await Axios({
        ...SummaryApi.getProductByCategoryAndSubCategory,
        data: {
          categoryId,
          subCategoryId,
          page,
          limit: 8,
        },
      });

      const { data: responseData } = response;
      if (responseData.success) {
        if (responseData.page === 1) {
          setData(responseData.data);
        } else {
          setData([...data, ...responseData.data]);
        }
        setTotalPage(responseData.totalCount);
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [params]);

  useEffect(() => {
    const sub = AllSubCategory.filter((s) => {
      const filterData = s.category.some((e1) => e1._id == categoryId);
      return filterData ? filterData : null;
    });
    setDisplayCategory(sub);
  }, [params, AllSubCategory]);

  return (
    <section className="relative top-24 lg:top-20 px-3 sm:px-5 md:px-8 py-4 min-h-screen bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
        {/* Sidebar (Sub Category Section) */}
        <aside className="md:col-span-2 lg:col-span-3 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 min-h-[80vh] max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-gray-100 hover:scrollbar-thumb-green-600 transition-all duration-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2 text-center">
            Subcategories
          </h2>

          {/* Subcategory Images */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-4">
            {DisplaySubCategory.map((s, index) => {
              const isActive = subCategoryId === s._id;
              
              const link = `/${validURLConvert(s?.category[0]?.name)}-${s?.category[0]?._id}/${validURLConvert(s.name)}-${s._id}`
              return (
                <Link to={link}
                  key={index}
                  onClick={() =>
                    navigate(`/product/${params.category}/${s.name}-${s._id}`)
                  }
                  className={`flex flex-col items-center rounded-xl p-3 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02] border ${isActive
                      ? "bg-green-50 border-green-500 ring-2 ring-green-400"
                      : "bg-gray-50 border-gray-200 hover:border-green-300"
                    }`}
                >
                  <img
                    src={s.image}
                    alt="SubCategory"
                    className={`w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-lg transition-transform duration-300 ${isActive ? "scale-110" : "hover:scale-105"
                      }`}
                  />
                  <p
                    className={`mt-2 text-sm font-medium text-center ${isActive ? "text-green-600" : "text-gray-700"
                      }`}
                  >
                    {s.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Product Section */}
        <main className="md:col-span-4 lg:col-span-9">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-md p-4 mb-4 border border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold text-lg sm:text-xl capitalize text-gray-800">
              {subCategoryName}
            </h3>
            <span className="text-sm text-gray-500">{data.length} Products</span>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {data.map((p, index) => (
              <CardProduct
                key={p._id + "productSubCategory" + index}
                data={p}
              />
            ))}
          </div>

          {/* Loading Spinner */}
          {loading && (
            <div className="flex justify-center mt-6">
              <Loading />
            </div>
          )}

          {/* No Products */}
          {!loading && data.length === 0 && (
            <div className="text-center text-gray-500 mt-10 text-sm sm:text-base">
              No products found in this subcategory.
            </div>
          )}
        </main>
      </div>
    </section>
  );
};

export default ProductListPage;
