/**
 * Lightweight in-memory rate limiter middleware for production API protection.
 * Automatically tracks request counts per IP per endpoint window without external dependencies.
 */
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 20,
  message = "Too many requests from this IP, please try again later.",
} = {}) => {
  const requests = new Map();

  // Periodically sweep expired entries to prevent memory growth
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requests.entries()) {
      if (now > data.resetTime) {
        requests.delete(key);
      }
    }
  }, Math.max(windowMs, 60000));

  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  return (req, res, next) => {
    // Never rate limit Stripe webhook events
    if (req.originalUrl && req.originalUrl.startsWith("/api/stripe-webhook")) {
      return next();
    }

    const ip =
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      "unknown-ip";

    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    const record = requests.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count += 1;
    requests.set(key, record);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - record.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      return res.status(429).json({
        message,
        error: true,
        success: false,
      });
    }

    next();
  };
};

// Preset rate limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per 15 min
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});

export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 min
  message: "Too many password reset attempts. Please try again in 15 minutes.",
});

export const orderRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: "Too many checkout attempts. Please wait a moment and try again.",
});
