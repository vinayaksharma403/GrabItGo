import CartProductModel from "../models/cartproduct.model.js";
import UserModel from "../models/user.model.js";

// Add to Cart
export const addToCartController = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.userId;

    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required",
        success: false,
        error: true,
      });
    }

    // Check if item already in cart
    const existingCartItem = await CartProductModel.findOne({ productId, userId });

    if (existingCartItem) {
      // Update quantity
      existingCartItem.quantity += quantity;
      await existingCartItem.save();
      return res.json({
        message: "Cart updated",
        data: existingCartItem,
        success: true,
        error: false,
      });
    } else {
      // Add new item
      const cartItem = new CartProductModel({
        productId,
        quantity,
        userId,
      });
      const savedItem = await cartItem.save();

      // Add to user's shopping_cart
      await UserModel.findByIdAndUpdate(userId, {
        $push: { shopping_cart: savedItem._id },
      });

      return res.json({
        message: "Added to cart",
        data: savedItem,
        success: true,
        error: false,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};

// Get Cart Items
export const getCartController = async (req, res) => {
  try {
    const userId = req.userId;

    const cartItems = await CartProductModel.find({ userId })
      .populate("productId")
      .lean();

    return res.json({
      message: "Cart fetched",
      data: cartItems,
      success: true,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};

// Update Cart Quantity
export const updateCartController = async (req, res) => {
  try {
    const { cartId, quantity } = req.body;
    const userId = req.userId;

    if (!cartId || quantity < 1) {
      return res.status(400).json({
        message: "Invalid cart ID or quantity",
        success: false,
        error: true,
      });
    }

    const updatedCart = await CartProductModel.findOneAndUpdate(
      { _id: cartId, userId },
      { quantity },
      { new: true }
    );

    if (!updatedCart) {
      return res.status(404).json({
        message: "Cart item not found",
        success: false,
        error: true,
      });
    }

    return res.json({
      message: "Cart updated",
      data: updatedCart,
      success: true,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};

// Remove from Cart
export const removeFromCartController = async (req, res) => {
  try {
    const { cartId } = req.body;
    const userId = req.userId;

    if (!cartId) {
      return res.status(400).json({
        message: "Cart ID is required",
        success: false,
        error: true,
      });
    }

    const deletedItem = await CartProductModel.findOneAndDelete({ _id: cartId, userId });

    if (!deletedItem) {
      return res.status(404).json({
        message: "Cart item not found",
        success: false,
        error: true,
      });
    }

    // Remove from user's shopping_cart
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { shopping_cart: cartId },
    });

    return res.json({
      message: "Removed from cart",
      success: true,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      success: false,
      error: true,
    });
  }
};
