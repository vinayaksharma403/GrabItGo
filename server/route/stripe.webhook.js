import { Router } from "express";
import { stripeWebhookController } from "../controllers/stripeWebhook.controller.js";

const router = Router();

// Stripe needs raw body; handled in server/index.js
router.post("/stripe-webhook", stripeWebhookController);

export default router;


