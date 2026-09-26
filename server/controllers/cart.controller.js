import CartProductModel from "../models/cartproduct.model.js";
import UserModel from "../models/user.model.js";
import ProductModel from "../models/product.model.js";

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

    const reqQuantity = Math.max(Number(quantity) || 1, 1);

    // Verify product exists and is published
    const product = await ProductModel.findById(productId);
    if (!product || product.publish === false) {
      return res.status(404).json({
        message: "Product is currently unavailable",
        success: false,
        error: true,
      });
    }

    const currentStock = Number(product.stock) || 0;
    if (currentStock < 1) {
      return res.status(400).json({
        message: "Product is out of stock",
        success: false,
        error: true,
      });
    }

    // Check if item already in cart
    const existingCartItem = await CartProductModel.findOne({ productId, userId });

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + reqQuantity;
      if (newQuantity > currentStock) {
        return res.status(400).json({
          message: `Only ${currentStock} units available in stock`,
          availableStock: currentStock,
          success: false,
          error: true,
        });
      }

      existingCartItem.quantity = newQuantity;
      await existingCartItem.save();
      return res.json({
        message: "Cart updated",
        data: existingCartItem,
        success: true,
        error: false,
      });
    } else {
      if (reqQuantity > currentStock) {
        return res.status(400).json({
          message: `Only ${currentStock} units available in stock`,
          availableStock: currentStock,
          success: false,
          error: true,
        });
      }

      const cartItem = new CartProductModel({
        productId,
        quantity: reqQuantity,
        userId,
      });
      const savedItem = await cartItem.save();

      // Add to user's shopping_cart
      await UserModel.findByIdAndUpdate(userId, {
        $addToSet: { shopping_cart: savedItem._id },
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

    const enrichedItems = cartItems.map((item) => {
      const product = item.productId;
      const isAvailable = Boolean(product && product.publish !== false && (product.stock ?? 0) >= item.quantity);
      return {
        ...item,
        isAvailable,
        availableStock: product?.stock ?? 0,
      };
    });

    return res.json({
      message: "Cart fetched",
      data: enrichedItems,
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

    const newQty = Number(quantity);
    if (!cartId || isNaN(newQty) || newQty < 1) {
      return res.status(400).json({
        message: "Invalid cart ID or quantity",
        success: false,
        error: true,
      });
    }

    const cartItem = await CartProductModel.findOne({ _id: cartId, userId });
    if (!cartItem) {
      return res.status(404).json({
        message: "Cart item not found",
        success: false,
        error: true,
      });
    }

    const product = await ProductModel.findById(cartItem.productId);
    if (!product || product.publish === false) {
      return res.status(400).json({
        message: "Product is no longer available",
        success: false,
        error: true,
      });
    }

    const currentStock = Number(product.stock) || 0;
    if (newQty > currentStock) {
      return res.status(400).json({
        message: `Cannot set quantity greater than available stock (${currentStock})`,
        availableStock: currentStock,
        success: false,
        error: true,
      });
    }

    cartItem.quantity = newQty;
    const updatedCart = await cartItem.save();

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
