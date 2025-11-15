import { Router } from "express";
import auth from "../middleware/auth.js";
import {
  createProductController,
  deleteProductDetails,
  getProductByCategory,
  getProductByCategoryAndSubCategory,
  getProductController,
  getProductDetails,
  
  updateProductDetails,
} from "../controllers/product.controller.js";
import { admin } from "../middleware/Admin.js";

const productRouter = Router();

productRouter.post("/create", auth,admin, createProductController);

productRouter.get("/get", getProductController);

productRouter.post("/get-product-by-category", getProductByCategory);
productRouter.post(
  "/get-product-by-category-and-subcategory",
  getProductByCategoryAndSubCategory
);

// product details (GET /:productId)
productRouter.get("/get-product-details/:productId", getProductDetails);
productRouter.put("/update-product-details", auth,admin, updateProductDetails);

// delete product route 

productRouter.delete('/delete-product',auth,admin,deleteProductDetails)


export default productRouter;
