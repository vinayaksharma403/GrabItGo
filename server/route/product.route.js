import { Router } from "express";
import auth from "../middleware/auth.js";
import {
  createProductController,
  getProductByCategory,
  getProductByCategoryAndSubCategory,
  getProductController,
  getProductDetails,
} from "../controllers/product.controller.js";

const productRouter = Router();

productRouter.post("/create", auth, createProductController);
productRouter.post("/get", getProductController);
productRouter.post("/get-product-by-category", getProductByCategory);
productRouter.post("/get-product-by-category-and-subcategory", getProductByCategoryAndSubCategory);
productRouter.get("/get-product-details/:productId", getProductDetails);

export default productRouter;
