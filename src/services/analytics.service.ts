import { AppDataSource } from '../config/database';
import { Analytics } from '../models/Analytics';
import { Payment } from '../models/Payment';

export class AnalyticsService {
  private analyticsRepository = AppDataSource.getRepository(Analytics);
  private paymentRepository = AppDataSource.getRepository(Payment);

  async trackEvent(
    eventType: string,
    eventData: any,
    userId?: string
  ): Promise<void> {
    const event = this.analyticsRepository.create({
      event_type: eventType,
      event_data: eventData,
      user_id: userId,
    });

    await this.analyticsRepository.save(event);
  }

  async trackPhoneClick(phoneId: string, userId?: string): Promise<void> {
    await this.trackEvent('phone_click', { phone_id: phoneId }, userId);
  }

  async trackConversionStart(phoneId: string, userId?: string): Promise<void> {
    await this.trackEvent('conversion_start', { phone_id: phoneId }, userId);
  }

  async trackAdRevenue(adType: string, revenue: number, userId?: string): Promise<void> {
    const event = this.analyticsRepository.create({
      event_type: 'ad_revenue',
      event_data: { ad_type: adType },
      revenue,
      user_id: userId,
    });

    await this.analyticsRepository.save(event);
  }

  async getCommissionEarnings(): Promise<{
    total_clicks: number;
    total_conversions: number;
    estimated_earnings: number;
  }> {
    const clicks = await this.analyticsRepository.count({
      where: { event_type: 'phone_click' },
    });

    const conversions = await this.analyticsRepository.count({
      where: { event_type: 'conversion_start' },
    });

    // Estimate: $5 per conversion (adjust based on actual affiliate rates)
    const estimatedEarnings = conversions * 5;

    return {
      total_clicks: clicks,
      total_conversions: conversions,
      estimated_earnings: estimatedEarnings,
    };
  }

  async getAdRevenue(startDate?: Date, endDate?: Date): Promise<{
    total_revenue: number;
    by_ad_type: { [key: string]: number };
  }> {
    const query = this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.event_type = :type', { type: 'ad_revenue' });

    if (startDate) {
      query.andWhere('analytics.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('analytics.created_at <= :endDate', { endDate });
    }

    const events = await query.getMany();

    const totalRevenue = events.reduce((sum, event) => sum + (event.revenue || 0), 0);
    const byAdType: { [key: string]: number } = {};

    events.forEach((event) => {
      const adType = event.event_data.ad_type || 'unknown';
      byAdType[adType] = (byAdType[adType] || 0) + (event.revenue || 0);
    });

    return {
      total_revenue: totalRevenue,
      by_ad_type: byAdType,
    };
  }

  async getSubscriptionRevenue(): Promise<{
    total_revenue: number;
    by_tier: { [key: string]: number };
    total_subscriptions: number;
  }> {
    const payments = await this.paymentRepository.find({
      where: { status: 'completed' },
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const byTier: { [key: string]: number } = {};

    payments.forEach((payment) => {
      byTier[payment.tier_id] = (byTier[payment.tier_id] || 0) + Number(payment.amount);
    });

    return {
      total_revenue: totalRevenue,
      by_tier: byTier,
      total_subscriptions: payments.length,
    };
  }

  async getDashboardStats(): Promise<any> {
    const [commissions, adRevenue, subscriptionRevenue] = await Promise.all([
      this.getCommissionEarnings(),
      this.getAdRevenue(),
      this.getSubscriptionRevenue(),
    ]);

    return {
      commissions,
      ad_revenue: adRevenue,
      subscription_revenue: subscriptionRevenue,
      total_revenue:
        commissions.estimated_earnings +
        adRevenue.total_revenue +
        subscriptionRevenue.total_revenue,
    };
  }
}
