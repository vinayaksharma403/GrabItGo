import { Router } from "express";
import auth from "../middleware/auth.js";
import {
  addToCartController,
  getCartController,
  updateCartController,
  removeFromCartController,
} from "../controllers/cart.controller.js";

const cartRouter = Router();

cartRouter.post("/add", auth, addToCartController);
cartRouter.get("/get", auth, getCartController);
cartRouter.put("/update", auth, updateCartController);
cartRouter.delete("/remove", auth, removeFromCartController);

export default cartRouter;
