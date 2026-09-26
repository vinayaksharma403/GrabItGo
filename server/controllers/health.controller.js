import mongoose from "mongoose";

/**
 * Health check controller for production monitoring and liveness probes.
 * Reports application status, database connectivity, uptime, and environment.
 * 
 * HTTP 200: Healthy (application and database connected)
 * HTTP 503: Service Unavailable (database disconnected/unreachable)
 */
export const healthCheckController = async (req, res) => {
  const readyState = mongoose.connection.readyState;
  // Mongoose readyState values:
  // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
  const isConnected = readyState === 1;

  const dbStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const healthData = {
    status: isConnected ? "ok" : "degraded",
    database: dbStateMap[readyState] || "unknown",
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  };

  if (!isConnected) {
    return res.status(503).json({
      ...healthData,
      message: "Database service is unavailable",
    });
  }

  return res.status(200).json(healthData);
};
