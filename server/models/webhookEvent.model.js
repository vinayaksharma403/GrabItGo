import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: [true, "Provide eventId"],
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: [true, "Provide eventType"],
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const WebhookEventModel = mongoose.model("webhookEvent", webhookEventSchema);

export default WebhookEventModel;
