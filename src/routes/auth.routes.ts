import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate, schemas } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', authLimiter, validate(schemas.register), authController.register.bind(authController));
router.post('/login', authLimiter, validate(schemas.login), authController.login.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));
router.post('/forgot-password', authLimiter, authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser.bind(authController));

export default router;
