import stripe from "stripe";
import CartProductModel from "../models/cartproduct.model.js";
import OrderModel from "../models/order.model.js";
import ProductModel from "../models/product.model.js";
import UserModel from "../models/user.model.js";
import WebhookEventModel from "../models/webhookEvent.model.js";

export const stripeWebhookController = async (req, res) => {
  try {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).json({ message: "Missing stripe-signature header", success: false, error: true });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secretKey || !webhookSecret) {
      return res.status(500).json({ message: "Stripe webhook configuration missing on server", success: false, error: true });
    }

    const stripeInstance = new stripe(secretKey);
    const rawBody = req.rawBody;

    let event;
    try {
      event = stripeInstance.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error("[Stripe Webhook] Signature verification failed:", err.message);
      return res.status(400).json({ message: `Webhook Error: ${err.message}`, success: false, error: true });
    }

    // 1. Database-backed webhook idempotency check
    const existingEvent = await WebhookEventModel.findOne({ eventId: event.id });
    if (existingEvent) {
      console.log(`[Stripe Webhook] Event ${event.id} already processed. Skipping.`);
      return res.status(200).json({ received: true, alreadyProcessed: true });
    }

    // 2. Handle payment_intent.succeeded
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;

      const orderQuery = orderId
        ? { orderId, payment_status: { $ne: "paid" } }
        : {
            $or: [
              { paymentId: paymentIntent.id },
              { stripePaymentIntentId: paymentIntent.id },
            ],
            payment_status: { $ne: "paid" },
          };

      const updatedOrder = await OrderModel.findOneAndUpdate(
        orderQuery,
        {
          payment_status: "paid",
          webhookEventId: event.id,
          stripePaymentIntentId: paymentIntent.id,
          paymentId: paymentIntent.id,
        },
        { new: true }
      );

      // Only perform fulfillment if this webhook execution actually transitioned the order to paid
      if (updatedOrder) {
        // Decrement inventory atomically
        for (const item of updatedOrder.items) {
          if (item.productId && item.quantity > 0) {
            const decResult = await ProductModel.findOneAndUpdate(
              { _id: item.productId, stock: { $gte: item.quantity } },
              { $inc: { stock: -item.quantity } },
              { new: true }
            );

            // Prevent negative stock in edge-cases
            if (!decResult) {
              await ProductModel.findOneAndUpdate(
                { _id: item.productId },
                { $set: { stock: 0 } }
              );
            }
          }
        }

        // Clear user's shopping cart
        await CartProductModel.deleteMany({ userId: updatedOrder.userId });
        await UserModel.findByIdAndUpdate(updatedOrder.userId, { shopping_cart: [] });
      }
    }

    // 3. Handle payment failure / cancellation
    if (event.type === "payment_intent.payment_failed" || event.type === "payment_intent.canceled") {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;
      const failedStatus = event.type === "payment_intent.canceled" ? "cancelled" : "failed";

      const orderQuery = orderId
        ? { orderId, payment_status: "pending" }
        : {
            $or: [
              { paymentId: paymentIntent.id },
              { stripePaymentIntentId: paymentIntent.id },
            ],
            payment_status: "pending",
          };

      await OrderModel.updateOne(
        orderQuery,
        {
          payment_status: failedStatus,
          webhookEventId: event.id,
          stripePaymentIntentId: paymentIntent.id,
        }
      );
    }

    // 4. Record event for permanent idempotency
    try {
      await new WebhookEventModel({
        eventId: event.id,
        eventType: event.type,
      }).save();
    } catch (saveErr) {
      // Ignore duplicate key error on race conditions
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook] Error:", err);
    return res.status(400).json({ message: err.message || err, success: false, error: true });
  }
};

