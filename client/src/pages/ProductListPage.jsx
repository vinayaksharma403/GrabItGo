import React, { useEffect, useState, useCallback, useRef } from "react";
import Axios from "../utils/axios";
import SummaryApi from "../common/SummaryApi";
import { useParams, Link, useSearchParams } from "react-router-dom";
import AxiosToastError from "../utils/AxiosToastError";
import CardLoading from "../components/CardLoading";
import CardProduct from "../components/CardProduct";
import NoData from "../components/NoData";
import ProductSortFilter from "../components/ProductSortFilter";
import { useSelector } from "react-redux";
import { validURLConvert } from "../utils/validURLConver";
import { FiChevronRight, FiHome } from "react-icons/fi";

const ProductListPage = () => {
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page] = useState(1);
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const AllSubCategory = useSelector((state) => state.product.allSubCategory);
  const [DisplaySubCategory, setDisplayCategory] = useState([]);
  const requestSeqRef = useRef(0);

  const sort = searchParams.get("sort") || "";
  const inStock = searchParams.get("inStock") === "true";

  const categorySegments = params?.category?.split("-") || [];
  const categoryName = categorySegments.slice(0, -1).join(" ") || "Category";
  const categoryId = categorySegments.slice(-1)[0];

  const subCategorySegments = params?.subCategory?.split("-") || [];
  const subCategoryName = subCategorySegments.slice(0, -1).join(" ") || "Products";
  const subCategoryId = subCategorySegments.slice(-1)[0];

  const handleSortChange = (newSort) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newSort) {
        next.set("sort", newSort);
      } else {
        next.delete("sort");
      }
      return next;
    });
  };

  const handleInStockChange = (newInStock) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newInStock) {
        next.set("inStock", "true");
      } else {
        next.delete("inStock");
      }
      return next;
    });
  };

  const handleReset = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("sort");
      next.delete("inStock");
      return next;
    });
  };

  const fetchProductData = useCallback(async () => {
    if (!categoryId || !subCategoryId) return;
    const currentSeq = ++requestSeqRef.current;
    try {
      setLoading(true);
      const response = await Axios({
        ...SummaryApi.getProductByCategoryAndSubCategory,
        data: {
          categoryId,
          subCategoryId,
          page,
          limit: 24,
          sort,
          inStock,
        },
      });

      const { data: responseData } = response;
      if (currentSeq === requestSeqRef.current && responseData.success) {
        setData(responseData.data || []);
        setTotalCount(responseData.totalCount ?? (responseData.data || []).length);
      }
    } catch (error) {
      if (currentSeq === requestSeqRef.current) {
        AxiosToastError(error);
      }
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  }, [categoryId, subCategoryId, page, sort, inStock]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  useEffect(() => {
    if (!categoryId) return;
    const sub = AllSubCategory.filter((s) => {
      return s.category?.some((e1) => (typeof e1 === "object" ? e1._id === categoryId : e1 === categoryId));
    });
    setDisplayCategory(sub);
  }, [categoryId, AllSubCategory]);

  const isFiltered = Boolean(sort || inStock);

  return (
    <section className="px-3 sm:px-5 md:px-8 py-4 min-h-[calc(100vh-80px)] bg-surface-50">
      <div className="max-w-7xl mx-auto">
        {/* Accessible Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="mb-4 text-xs font-medium text-surface-muted flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-brand-600 transition-colors p-0.5">
            <FiHome size={13} />
            <span>Home</span>
          </Link>
          <FiChevronRight size={13} className="text-surface-muted/60" />
          <span className="capitalize">{categoryName}</span>
          <FiChevronRight size={13} className="text-surface-muted/60" />
          <span className="font-semibold text-surface-title capitalize">{subCategoryName}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-5">
          {/* Subcategories Sidebar / Top Strip on mobile */}
          <aside className="md:col-span-2 lg:col-span-3 bg-white rounded-card shadow-subtle border border-surface-border p-3.5 min-h-0 md:min-h-[75vh] max-h-56 md:max-h-[80vh] overflow-y-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-surface-muted mb-3 px-1">
              Subcategories
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-2 sm:gap-2.5">
              {DisplaySubCategory.map((s, index) => {
                const isActive = subCategoryId === s._id;
                const catObj = s?.category?.[0];
                const catName = typeof catObj === "object" ? catObj?.name : categoryName;
                const catId = typeof catObj === "object" ? catObj?._id : categoryId;
                const link = `/${validURLConvert(catName || "cat")}-${catId}/${validURLConvert(s.name || "sub")}-${s._id}`;

                return (
                  <Link
                    to={link}
                    key={s._id || index}
                    aria-label={`View ${s.name} subcategory`}
                    className={`flex flex-col md:flex-row items-center gap-2.5 rounded-control p-2 sm:p-2.5 transition-all text-xs sm:text-sm font-medium border ${
                      isActive
                        ? "bg-brand-50/80 border-brand-500 ring-2 ring-brand-500/20 text-brand-700 shadow-xs font-semibold"
                        : "bg-surface-50 border-surface-border/70 text-surface-title hover:border-brand-300 hover:bg-white"
                    }`}
                  >
                    <div className="w-12 h-12 md:w-10 md:h-10 flex items-center justify-center bg-white rounded-lg p-1 shrink-0 overflow-hidden border border-surface-border/50">
                      <img
                        src={s.image || "/placeholder.png"}
                        alt={s.name || "SubCategory"}
                        loading="lazy"
                        onError={(e) => {
                          if (e.target.src !== "/placeholder.png") {
                            e.target.src = "/placeholder.png";
                          }
                        }}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-center md:text-left line-clamp-2 leading-tight">
                      {s.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </aside>

          {/* Product Catalog Grid */}
          <main className="md:col-span-4 lg:col-span-9 flex flex-col">
            {/* Section Header */}
            <div className="bg-white rounded-card shadow-subtle p-3.5 sm:p-4 mb-3 border border-surface-border flex items-center justify-between flex-wrap gap-2">
              <div>
                <h1 className="font-bold text-base sm:text-xl capitalize text-surface-title">
                  {subCategoryName}
                </h1>
                <p className="text-xs text-surface-muted hidden sm:block">
                  Showing available items in {subCategoryName}
                </p>
              </div>
              <span className="badge-neutral text-xs font-semibold px-2.5 py-1">
                {totalCount} {totalCount === 1 ? "Product" : "Products"}
              </span>
            </div>

            {/* Filter and Sort Control Bar */}
            <ProductSortFilter
              sort={sort}
              inStock={inStock}
              onSortChange={handleSortChange}
              onInStockChange={handleInStockChange}
              onReset={handleReset}
              totalCount={totalCount}
            />

            {/* Skeleton Loading State */}
            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {new Array(8).fill(null).map((_, index) => (
                  <CardLoading key={"CatalogLoading" + index} />
                ))}
              </div>
            )}

            {/* Product Grid */}
            {!loading && data.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {data.map((p, index) => (
                  <CardProduct
                    key={p._id + "productSubCategory" + index}
                    data={p}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && data.length === 0 && (
              <div className="py-12 bg-white rounded-card border border-surface-border my-auto">
                <NoData
                  title={isFiltered ? `No matching products in ${subCategoryName}` : `No products in ${subCategoryName}`}
                  description={
                    isFiltered
                      ? "Try clearing your filters or selecting a different sort option to view all available products."
                      : "We are regularly restocking our catalog. Try browsing other popular categories!"
                  }
                  actionText={isFiltered ? "Clear Filters" : "Explore Categories"}
                  actionHref={isFiltered ? undefined : "/#categories"}
                  onAction={isFiltered ? handleReset : undefined}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  );
};

export default ProductListPage;
