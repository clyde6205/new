import { Response } from 'express';
import { AuthRequest } from '../types';
import { AnalyticsService } from '../services/analytics.service';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async trackPhoneClick(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { phoneId } = req.body;
      await analyticsService.trackPhoneClick(phoneId, req.user?.id);

      res.json({
        success: true,
        message: 'Event tracked',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async trackConversionStart(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { phoneId } = req.body;
      await analyticsService.trackConversionStart(phoneId, req.user?.id);

      res.json({
        success: true,
        message: 'Event tracked',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getCommissionEarnings(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const earnings = await analyticsService.getCommissionEarnings();

      res.json({
        success: true,
        data: earnings,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getDashboardStats(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await analyticsService.getDashboardStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
