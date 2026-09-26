import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.ObjectId,
      ref: "product",
      required: true,
    },
    name: { type: String, required: true },
    image: { type: Array, default: [] },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    orderId: {
      type: String,
      required: [true, "Provide orderId"],
      unique: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      default: [],
      validate: [(v) => Array.isArray(v) && v.length > 0, "Order must have items"],
    },

    paymentId: {
      type: String,
      default: "",
      index: true,
    },

    payment_status: {
      type: String,
      default: "pending",
      enum: ["pending", "paid", "failed", "cancelled"],
      index: true,
    },

    delivery_address: {
      type: mongoose.Schema.ObjectId,
      ref: "address",
      required: true,
    },

    subTotalAmt: { type: Number, default: 0 },
    totalAmt: { type: Number, default: 0 },

    // Optional fields for debugging / receipt
    invoice_receipt: { type: String, default: "" },

    // Stripe webhook bookkeeping
    stripePaymentIntentId: { type: String, default: "" },
    webhookEventId: { type: String, default: "" },
  },
  { timestamps: true }
);

const OrderModel = mongoose.model("order", orderSchema);

export default OrderModel;

