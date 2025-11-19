export const baseURL = "http://localhost:8050";

const SummaryApi = {
  // USER
  register: { url: "/api/user/register", method: "post" },
  login: { url: "/api/user/login", method: "post" },
  forgot_password: { url: "/api/user/forgot-password", method: "put" },
  forgot_password_otp_verification: {
    url: "/api/user/verify-forgot-password-otp",
    method: "put",
  },
  resetPassword: { url: "/api/user/reset-password", method: "put" },
  refreshToken: { url: "/api/user/refresh-token", method: "post" },
  userDetails: { url: "/api/user/user-details", method: "get" },
  logout: { url: "/api/user/logout", method: "get" },
  uploadAvatar: { url: "/api/user/upload-avatar", method: "put" },
  updateUserDetails: { url: "/api/user/update-user", method: "put" },

  // CATEGORY
  addCategory: { url: "/api/category/add-category", method: "post" },
  uploadImage: { url: "/api/file/upload", method: "post" },
  getCategory: { url: "/api/category/get", method: "get" },
  updateCategory: { url: "/api/category/update", method: "put" },
  deleteCategory: { url: "/api/category/delete", method: "delete" },

  // SUBCATEGORY
  createSubCategory: { url: "/api/subcategory/create", method: "post" },
  getSubCategory: { url: "/api/subcategory/get", method: "get" },
  updateSubCategory: { url: "/api/subcategory/update", method: "put" },
  deleteSubCategory: { url: "/api/subcategory/delete", method: "delete" },

  // PRODUCT
  createProduct: { url: "/api/product/create", method: "post" },
  getProduct: { url: "/api/product/get", method: "get" },

  getProductByCategory: {
    url: "/api/product/get-product-by-category",
    method: "post",
  },
  getProductByCategoryAndSubCategory: {
    url: "/api/product/get-product-by-category-and-subcategory",
    method: "post",
  },

  // GET PRODUCT DETAILS (append /:id manually)
  getProductDetails: "/api/product/get-product-details",

  // ✅ NEW: UPDATE PRODUCT (append /:productId manually)
  updateProduct: { url: "/api/product/update-product-details", method: "put" },
  deleteProductDetails : {url : "/api/product/delete-product",method : "delete"},

  // CART
  addToCart: { url: "/api/cart/add", method: "post" },
  getCart: { url: "/api/cart/get", method: "get" },
  updateCart: { url: "/api/cart/update", method: "put" },
  removeFromCart: { url: "/api/cart/remove", method: "delete" },

  // ORDER
  createOrder: { url: "/api/order/create", method: "post" },
  getOrders: { url: "/api/order/get", method: "get" },
  updateOrderStatus: { url: "/api/order/update-status", method: "put" },

  // ADDRESS
  addAddress: { url: "/api/address/add", method: "post" },
  getAddress: { url: "/api/address/get", method: "get" },
  updateAddress: { url: "/api/address/update", method: "put" },
  deleteAddress: { url: "/api/address/delete", method: "delete" },
};

export default SummaryApi;
