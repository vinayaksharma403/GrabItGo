import { Router } from "express";
import auth from "../middleware/auth.js";
import { admin } from "../middleware/Admin.js";
import { orderRateLimiter } from "../middleware/rateLimiter.js";
import {
  createOrderController,
  getOrdersController,
  getOrderDetailsController,
  updateOrderStatusController,
  getAllOrdersAdminController,
} from "../controllers/order.controller.js";

const orderRouter = Router();

orderRouter.post("/create", auth, orderRateLimiter, createOrderController);
orderRouter.get("/get", auth, getOrdersController);
orderRouter.get("/details/:orderId", auth, getOrderDetailsController);
orderRouter.get("/admin/all", auth, admin, getAllOrdersAdminController);
orderRouter.put("/update-status", auth, admin, updateOrderStatusController);

export default orderRouter;
