import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
const analyticsController = new AnalyticsController();

// Public analytics (for tracking)
router.post('/phone-click', analyticsController.trackPhoneClick.bind(analyticsController));
router.post('/conversion-start', analyticsController.trackConversionStart.bind(analyticsController));

// Admin-only analytics
router.get('/commission-earnings', authenticate, requireAdmin, analyticsController.getCommissionEarnings.bind(analyticsController));
router.get('/dashboard', authenticate, requireAdmin, analyticsController.getDashboardStats.bind(analyticsController));

export default router;
