import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const paymentController = new PaymentController();

// Protected payment routes
router.post('/stripe/subscribe', authenticate, paymentController.createStripeSubscription.bind(paymentController));
router.post('/mpesa/subscribe', authenticate, paymentController.createMpesaSubscription.bind(paymentController));
router.post('/paystack/subscribe', authenticate, paymentController.createPaystackSubscription.bind(paymentController));
router.get('/status/:transactionId', authenticate, paymentController.getPaymentStatus.bind(paymentController));
router.post('/cancel', authenticate, paymentController.cancelSubscription.bind(paymentController));

// Webhook routes (no auth required)
router.post('/mpesa/callback', paymentController.mpesaCallback.bind(paymentController));
router.get('/paystack/callback', paymentController.paystackCallback.bind(paymentController));

export default router;
