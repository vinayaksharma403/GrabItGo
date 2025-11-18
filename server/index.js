import express, { response } from 'express'
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

dotenv.config()

const app = express()

app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL
}))

// ✅ Increase payload limit (fixes "PayloadTooLargeError")
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

app.use(cookieParser())
app.use(helmet({
    crossOriginResourcePolicy: false
}))

// Optional: Add logging for requests (if needed)
// app.use(morgan('dev'))

const PORT = process.env.PORT || 8050

app.get("/", (request, response) => {
    response.json({
        message: "Server is running " + PORT
    })
})

app.use('/api/user', userRouter)
app.use('/api/category', categoryRouter)
app.use('/api/file', uploadRouter)
app.use('/api/subcategory', subCategoryRouter)
app.use("/api/product",productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("Server is running", PORT)
    })
})
