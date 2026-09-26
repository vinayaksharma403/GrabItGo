/**
 * Centralized Error Handling Middleware for GrabItGo Backend.
 * Standardizes API error responses and prevents sensitive data/stack traces from leaking in production.
 */
export const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";

  // Log error on server without leaking sensitive request credentials
  if (!isProduction) {
    console.error("[ServerError]", err);
  } else {
    console.error(`[ServerError] ${err.name || "Error"}: ${err.message}`);
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      message: `Invalid ID format for parameter '${err.path}'`,
      error: true,
      success: false,
    });
  }

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      message: messages.join(", ") || "Validation failed",
      error: true,
      success: false,
    });
  }

  // Handle MongoDB Duplicate Key Error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      message: `A record with this ${field} already exists`,
      error: true,
      success: false,
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      message: "Authentication token is invalid or expired",
      error: true,
      success: false,
    });
  }

  // Handle Multer upload errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "File size exceeds the 5MB limit",
        error: true,
        success: false,
      });
    }
    return res.status(400).json({
      message: `File upload error: ${err.message}`,
      error: true,
      success: false,
    });
  }

  // Default fallback status and message
  const statusCode = err.statusCode || err.status || 500;
  const message =
    isProduction && statusCode === 500
      ? "Internal Server Error. Please try again later."
      : err.message || "An unexpected error occurred.";

  return res.status(statusCode).json({
    message,
    error: true,
    success: false,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

/**
 * 404 Not Found Middleware for unhandled API routes
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    error: true,
    success: false,
  });
};
