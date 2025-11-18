import { Router } from "express";
import auth from "../middleware/auth.js";
import { admin } from "../middleware/Admin.js";
import {
  createOrderController,
  getOrdersController,
  updateOrderStatusController,
} from "../controllers/order.controller.js";

const orderRouter = Router();

orderRouter.post("/create", auth, createOrderController);
orderRouter.get("/get", auth, getOrdersController);
orderRouter.put("/update-status", auth, admin, updateOrderStatusController);

export default orderRouter;
