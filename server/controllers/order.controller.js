import mongoose from "mongoose";
import OrderModel from "../models/order.model.js";
import CartProductModel from "../models/cartproduct.model.js";
import AddressModel from "../models/address.model.js";
import ProductModel from "../models/product.model.js";
import stripe from "stripe";

const generateOrderId = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
};

// Create Order (does NOT clear cart; webhook will)
export const createOrderController = async (req, res) => {
  try {
    const { addressId, paymentMethod = "card" } = req.body;
    const userId = req.userId;

    if (!addressId) {
      return res.status(400).json({
        message: "Delivery address is required",
        success: false,
        error: true,
      });
    }

    // Enforce address ownership and existence
    const address = await AddressModel.findOne({ _id: addressId, userId });
    if (!address) {
      return res.status(400).json({
        message: "Invalid or unauthorized delivery address",
        success: false,
        error: true,
      });
    }

    const cartItems = await CartProductModel.find({ userId }).populate("productId");
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
        success: false,
        error: true,
      });
    }

    const validationErrors = [];
    const validOrderItems = [];
    let subTotalAmt = 0;

    for (const item of cartItems) {
      const productId = item.productId?._id || item.productId;
      const product = await ProductModel.findById(productId);

      if (!product || product.publish === false) {
        validationErrors.push({
          productId: String(productId),
          name: item.productId?.name || "Product",
          reason: "Product is unavailable or discontinued",
          requestedQuantity: item.quantity,
          availableStock: 0,
        });
        continue;
      }

      const quantity = Number(item.quantity) || 1;
      if (quantity < 1) {
        validationErrors.push({
          productId: String(product._id),
          name: product.name,
          reason: "Invalid quantity specified",
          requestedQuantity: quantity,
          availableStock: product.stock ?? 0,
        });
        continue;
      }

      const currentStock = Number(product.stock) || 0;
      if (quantity > currentStock) {
        validationErrors.push({
          productId: String(product._id),
          name: product.name,
          reason: `Requested ${quantity} units, but only ${currentStock} in stock`,
          requestedQuantity: quantity,
          availableStock: currentStock,
        });
        continue;
      }

      // Server-authoritative calculation directly from MongoDB product record
      const price = Number(product.price) || 0;
      const discountPercent = Number(product.discount) || 0;
      const unitPrice = price - (price * discountPercent) / 100;
      const lineTotal = unitPrice * quantity;

      subTotalAmt += lineTotal;

      validOrderItems.push({
        productId: product._id,
        name: product.name,
        image: Array.isArray(product.image) ? product.image : [],
        quantity,
        unitPrice,
        discountPercent,
        lineTotal,
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Some products in your cart are unavailable or out of stock. Please adjust your cart.",
        errors: validationErrors,
        success: false,
        error: true,
      });
    }

    if (validOrderItems.length === 0) {
      return res.status(400).json({
        message: "No valid items to checkout",
        success: false,
        error: true,
      });
    }

    const totalAmt = subTotalAmt;
    const orderId = generateOrderId();

    let clientSecret = "";
    let paymentIntentId = "";
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLIC_KEY || "";

    if (secretKey) {
      const stripeClient = new stripe(secretKey);
      const currency = (process.env.STRIPE_CURRENCY || "inr").toLowerCase();
      const paymentIntent = await stripeClient.paymentIntents.create(
        {
          amount: Math.round(totalAmt * 100),
          currency,
          payment_method_types: [paymentMethod],
          metadata: {
            userId: String(userId),
            orderId,
          },
        },
        {
          idempotencyKey: `order_${userId}_${orderId}`,
        }
      );
      clientSecret = paymentIntent.client_secret;
      paymentIntentId = paymentIntent.id;
    }

    const savedOrder = await new OrderModel({
      userId,
      orderId,
      items: validOrderItems,
      paymentId: paymentIntentId,
      stripePaymentIntentId: paymentIntentId,
      payment_status: "pending",
      delivery_address: addressId,
      subTotalAmt,
      totalAmt,
    }).save();

    return res.json({
      message: "Order created successfully",
      data: {
        order: savedOrder,
        clientSecret,
        publishableKey,
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

export const getOrdersController = async (req, res) => {
  try {
    const userId = req.userId;

    const orders = await OrderModel.find({ userId })
      .populate("delivery_address")
      .sort({ createdAt: -1 })
      .lean();

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

// Get single order details (ownership restricted)
export const getOrderDetailsController = async (req, res) => {
  try {
    const userId = req.userId;
    const { orderId } = req.params;

    const order = await OrderModel.findOne({ orderId, userId })
      .populate("delivery_address")
      .lean();
    if (!order) {
      return res.status(404).json({
        message: "Order not found",
        success: false,
        error: true,
      });
    }

    return res.json({
      message: "Order details fetched",
      data: order,
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

// Get All Orders for Admin (Paginated, Filterable & Searchable)
export const getAllOrdersAdminController = async (req, res) => {
  try {
    let { page = 1, limit = 15, status = "", search = "" } = req.query;

    page = Math.max(Number(page) || 1, 1);
    limit = Math.min(Math.max(Number(limit) || 15, 1), 100);
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by payment_status
    const allowedStatuses = new Set(["pending", "paid", "failed", "cancelled"]);
    if (status && allowedStatuses.has(status.toLowerCase())) {
      query.payment_status = status.toLowerCase();
    }

    // Search by orderId or product name
    if (search && search.trim()) {
      const sanitizedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { orderId: { $regex: sanitizedSearch, $options: "i" } },
        { "items.name": { $regex: sanitizedSearch, $options: "i" } },
      ];
    }

    const [orders, totalCount] = await Promise.all([
      OrderModel.find(query)
        .populate("userId", "name email mobile avatar")
        .populate("delivery_address")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments(query),
    ]);

    return res.json({
      message: "Admin orders fetched successfully",
      data: orders,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
      currentPage: page,
      limit,
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
    const { orderId, _id, status } = req.body;
    const targetId = orderId || _id;

    if (!targetId) {
      return res.status(400).json({
        message: "Order ID is required",
        success: false,
        error: true,
      });
    }

    const allowed = new Set(["pending", "paid", "failed", "cancelled"]);
    const normalizedStatus = String(status || "").toLowerCase();
    if (!allowed.has(normalizedStatus)) {
      return res.status(400).json({
        message: "Invalid status value. Allowed: pending, paid, failed, cancelled",
        success: false,
        error: true,
      });
    }

    const query = mongoose.isValidObjectId(targetId)
      ? { $or: [{ orderId: targetId }, { _id: targetId }] }
      : { orderId: targetId };

    const updatedOrder = await OrderModel.findOneAndUpdate(
      query,
      { payment_status: normalizedStatus },
      { new: true }
    )
      .populate("userId", "name email mobile")
      .populate("delivery_address");

    if (!updatedOrder) {
      return res.status(404).json({
        message: "Order not found",
        success: false,
        error: true,
      });
    }

    return res.json({
      message: "Order status updated successfully",
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