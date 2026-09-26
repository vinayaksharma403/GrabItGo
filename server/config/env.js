import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 8050,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  mongodbUri: process.env.MONGODB_URI,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwt: {
    accessSecret: process.env.SECRET_KEY_ACCESS_TOKEN,
    refreshSecret: process.env.SECRET_KEY_REFRESH_TOKEN,
    accessExpiry: '5h',
    refreshExpiry: '7d',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET_KEY,
  },
  resend: {
    apiKey: process.env.RESEND_API,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    currency: process.env.STRIPE_CURRENCY || 'inr',
  },
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  },
};

export default config;
