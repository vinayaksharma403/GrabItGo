import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import AdminPermission from "../layouts/AdminPermission";
import Loading from "../components/Loading";

const SearchPage = lazy(() => import("../pages/SearchPage"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const OtpVerification = lazy(() => import("../pages/OtpVerification"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const VerifyEmail = lazy(() => import("../pages/VerifyEmail"));
const UserMenuMobile = lazy(() => import("../pages/UserMenuMobile"));
const Dashboard = lazy(() => import("../layouts/Dashboard"));
const Profile = lazy(() => import("../pages/Profile"));
const MyOrders = lazy(() => import("../pages/MyOrders"));
const Address = lazy(() => import("../pages/Address"));
const CategoryPage = lazy(() => import("../pages/CategoryPage"));
const SubCategoryPage = lazy(() => import("../pages/SubCategoryPage"));
const UploadProduct = lazy(() => import("../pages/UploadProduct"));
const ProductAdmin = lazy(() => import("../pages/ProductAdmin"));
const AdminOrders = lazy(() => import("../pages/AdminOrders"));
const ProductListPage = lazy(() => import("../pages/ProductListPage"));
const ProductDisplayPage = lazy(() => import("../pages/ProductDisplayPage"));
const EditProductAdmin = lazy(() => import("../components/EditProductAdmin"));
const Cart = lazy(() => import("../pages/Cart"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

const withSuspense = (element) => (
  <Suspense fallback={<Loading />}>
    {element}
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "search",
        element: withSuspense(<SearchPage />),
      },
      {
        path: "login",
        element: withSuspense(<Login />),
      },
      {
        path: "register",
        element: withSuspense(<Register />),
      },
      {
        path: "forgot-password",
        element: withSuspense(<ForgotPassword />),
      },
      {
        path: "verification-otp",
        element: withSuspense(<OtpVerification />),
      },
      {
        path: "reset-password",
        element: withSuspense(<ResetPassword />),
      },
      {
        path: "verify-email",
        element: withSuspense(<VerifyEmail />),
      },
      {
        path: "user",
        element: withSuspense(<UserMenuMobile />),
      },
      {
        path: "dashboard",
        element: withSuspense(<Dashboard />),
        children: [
          {
            path: "profile",
            element: withSuspense(<Profile />),
          },
          {
            path: "myorders",
            element: withSuspense(<MyOrders />),
          },
          {
            path: "address",
            element: withSuspense(<Address />),
          },
          {
            path: "category",
            element: (
              <AdminPermission>
                {withSuspense(<CategoryPage />)}
              </AdminPermission>
            ),
          },
          {
            path: "subcategory",
            element: (
              <AdminPermission>
                {withSuspense(<SubCategoryPage />)}
              </AdminPermission>
            ),
          },
          {
            path: "upload-product",
            element: (
              <AdminPermission>
                {withSuspense(<UploadProduct />)}
              </AdminPermission>
            ),
          },
          {
            path: "product",
            element: (
              <AdminPermission>
                {withSuspense(<ProductAdmin />)}
              </AdminPermission>
            ),
          },
          {
            path: "product/edit/:id",
            element: (
              <AdminPermission>
                {withSuspense(<EditProductAdmin />)}
              </AdminPermission>
            ),
          },
          {
            path: "orders",
            element: (
              <AdminPermission>
                {withSuspense(<AdminOrders />)}
              </AdminPermission>
            ),
          },
        ],
      },
      {
        path: ":category",
        children: [
          {
            path: ":subCategory",
            element: withSuspense(<ProductListPage />),
          },
        ],
      },
      {
        path: "product/:product",
        element: withSuspense(<ProductDisplayPage />),
      },
      {
        path: "cart",
        element: withSuspense(<Cart />),
      },
      {
        path: "*",
        element: withSuspense(<NotFoundPage />),
      },
    ],
  },
]);

export default router;
