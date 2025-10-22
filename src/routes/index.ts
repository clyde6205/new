import { Router } from 'express';
import authRoutes from './auth.routes';
import weatherRoutes from './weather.routes';
import communityRoutes from './community.routes';
import profileRoutes from './profile.routes';
import contactsRoutes from './contacts.routes';
import paymentRoutes from './payment.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

// API version prefix
const API_VERSION = process.env.API_VERSION || 'v1';

// Mount routes
router.use(`/api/auth`, authRoutes);
router.use(`/api/weather`, weatherRoutes);
router.use(`/api/community`, communityRoutes);
router.use(`/api/profile`, profileRoutes);
router.use(`/api/contacts`, contactsRoutes);
router.use(`/api/payments`, paymentRoutes);
router.use(`/api/analytics`, analyticsRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'AfWeather Backend API is running',
    version: API_VERSION,
    timestamp: new Date().toISOString(),
  });
});

// API info
router.get('/api', (_req, res) => {
  res.json({
    success: true,
    name: 'AfWeather Backend API',
    version: API_VERSION,
    description: 'Enterprise-grade backend for AfWeather - Serving billions of farmers globally',
    endpoints: {
      auth: '/api/auth',
      weather: '/api/weather',
      community: '/api/community',
      profile: '/api/profile',
      contacts: '/api/contacts',
      payments: '/api/payments',
      analytics: '/api/analytics',
    },
  });
});

export default router;
