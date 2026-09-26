import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import helmet from 'helmet'
import connectDB from './config/connectDB.js'
import userRouter from './route/user.route.js'
import categoryRouter from './route/category.route.js'
import uploadRouter from './route/upload.router.js'
import subCategoryRouter from './route/subCategory.route.js'
import productRouter from './route/product.route.js'
import cartRouter from './route/cart.route.js'
import orderRouter from './route/order.route.js'
import addressRouter from './route/address.route.js'
import stripeWebhookRouter from './route/stripe.webhook.js'
import healthRouter from './route/health.route.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }
    return callback(new Error("Blocked by CORS policy"), false);
  },
}))

// ✅ Stripe webhook requires raw body. Mount before normal JSON parsing.
app.use('/api', (req, res, next) => {
  if (req.originalUrl.startsWith('/api/stripe-webhook')) {
    return express.raw({ type: '*/*' })(req, res, next)
  }
  next()
})

app.use((req, res, next) => {
  if (req.body && Buffer.isBuffer(req.body)) {
    req.rawBody = req.body
  }
  next()
})

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

app.use(cookieParser())
app.use(helmet({
  crossOriginResourcePolicy: false,
}))

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

const PORT = process.env.PORT || 8050

app.get("/", (request, response) => {
  response.json({
    message: "Server is running " + PORT,
    success: true,
  })
})

app.get("/welcome", (request, response) => {
  response.json({
    message: "Welcome to the GrabItGo API Service!",
    success: true,
  })
})

app.use('/api/user', userRouter)
app.use('/api/category', categoryRouter)
app.use('/api/file', uploadRouter)
app.use('/api/subcategory', subCategoryRouter)
app.use("/api/product", productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)
app.use('/api/address', addressRouter)
app.use('/api', stripeWebhookRouter)
app.use('/api', healthRouter)

// Unhandled route handler (404)
app.use(notFoundHandler)

// Centralized error handler
app.use(errorHandler)

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is running on port", PORT)
  })
})
