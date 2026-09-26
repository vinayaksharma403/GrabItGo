import { Router } from 'express';
import {
  forgotPasswordController,
  loginController,
  logoutController,
  refreshToken,
  registerUserController,
  resetPassword,
  updateUserDetails,
  uploadAvatar,
  userDetails,
  verifyEmailController,
  verifyForgotPasswordOtp,
} from '../controllers/user.controller.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/multer.js';
import { authRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimiter.js';

const userRouter = Router();

userRouter.post('/register', authRateLimiter, registerUserController);
userRouter.post('/verify-email', authRateLimiter, verifyEmailController);
userRouter.post('/login', authRateLimiter, loginController);
userRouter.post('/refresh-token', authRateLimiter, refreshToken);

userRouter.get('/logout', auth, logoutController);
userRouter.put('/upload-avatar', auth, upload.single('avatar'), uploadAvatar);
userRouter.put('/update-user', auth, updateUserDetails);
userRouter.put('/forgot-password', passwordResetRateLimiter, forgotPasswordController);
userRouter.put('/verify-forgot-password-otp', passwordResetRateLimiter, verifyForgotPasswordOtp);
userRouter.put('/reset-password', passwordResetRateLimiter, resetPassword);
userRouter.get('/user-details', auth, userDetails);

export default userRouter;
