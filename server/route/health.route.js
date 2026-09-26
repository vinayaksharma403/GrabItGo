import { Router } from "express";
import { healthCheckController } from "../controllers/health.controller.js";

const healthRouter = Router();

// Public health check route (no auth required)
healthRouter.get("/health", healthCheckController);

export default healthRouter;
