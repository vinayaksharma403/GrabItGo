import OrderModel from "../models/order.model.js";
import CartProductModel from "../models/cartproduct.model.js";
import UserModel from "../models/user.model.js";
import AddressModel from "../models/address.model.js";
import ProductModel from "../models/product.model.js";
import stripe from "stripe";

// Initialize Stripe
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

// Create Order
export const createOrderController = async (req, res) => {
  try {
    const { addressId, paymentMethod = "card" } = req.body;
    const userId = req.userId;

    // Get user's cart
    const cartItems = await CartProductModel.find({ userId }).populate("productId");
    if (cartItems.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
        success: false,
        error: true,
      });
    }

    // Get address
    const address = await AddressModel.findById(addressId);
    if (!address) {
      return res.status(400).json({
        message: "Address not found",
        success: false,
        error: true,
      });
    }

    // Calculate totals
    let subTotalAmt = 0;
    const productDetails = [];

    for (const item of cartItems) {
      const product = item.productId;
      const quantity = item.quantity;
      const price = product.price;
      const discount = product.discount || 0;
      const discountedPrice = price - (price * discount / 100);

      subTotalAmt += discountedPrice * quantity;

      productDetails.push({
        name: product.name,
        image: product.image,
        quantity,
        price: discountedPrice,
      });
    }

    const totalAmt = subTotalAmt; // Add shipping/tax if needed

    // Create Stripe payment intent
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: Math.round(totalAmt * 100), // Stripe expects amount in cents
      currency: "usd",
      payment_method_types: [paymentMethod],
      metadata: {
        userId,
        addressId,
      },
    });

    // Create order
    const order = new OrderModel({
      userId,
      orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: cartItems[0].productId._id, // For simplicity, assuming single product orders
      product_details: productDetails[0],
      paymentId: paymentIntent.id,
      payment_status: "pending",
      delivery_address: addressId,
      subTotalAmt,
      totalAmt,
    });

    const savedOrder = await order.save();

    // Clear cart
    await CartProductModel.deleteMany({ userId });

    return res.json({
      message: "Order created successfully",
      data: {
        order: savedOrder,
        clientSecret: paymentIntent.client_secret,
      },
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

// Get User Orders
export const getOrdersController = async (req, res) => {
  try {
    const userId = req.userId;

    const orders = await OrderModel.find({ userId })
      .populate("delivery_address")
      .sort({ createdAt: -1 });

    return res.json({
      message: "Orders fetched successfully",
      data: orders,
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

// Update Order Status (Admin)
export const updateOrderStatusController = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      { payment_status: status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        message: "Order not found",
        success: false,
        error: true,
      });
    }

    return res.json({
      message: "Order status updated",
      data: updatedOrder,
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
