import Stripe from 'stripe';
import axios from 'axios';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Payment } from '../models/Payment';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-16',
});

export class PaymentService {
  private userRepository = AppDataSource.getRepository(User);
  private paymentRepository = AppDataSource.getRepository(Payment);

  // Subscription tiers
  private tiers = {
    free: { price: 0, name: 'Free', features: [] },
    premium: { price: 4.99, name: 'Premium', features: ['Advanced weather', 'No ads'] },
    upgrade: { price: 9.99, name: 'Upgrade', features: ['All features', 'Priority support'] },
  };

  // ==================== STRIPE ====================
  async createStripeSubscription(
    userId: string,
    tierId: string,
    paymentMethodId: string
  ): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const tier = this.tiers[tierId as keyof typeof this.tiers];
    if (!tier) {
      throw new AppError('Invalid subscription tier', 400);
    }

    try {
      // Create or get Stripe customer
      let customerId = user.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          payment_method: paymentMethodId,
          invoice_settings: { default_payment_method: paymentMethodId },
        });
        customerId = customer.id;
        user.stripe_customer_id = customerId;
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: process.env[`STRIPE_PRICE_${tierId.toUpperCase()}`] || '' }],
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user
      user.subscription_tier = tierId;
      user.stripe_subscription_id = subscription.id;
      user.subscription_expires_at = new Date(subscription.current_period_end * 1000);
      await this.userRepository.save(user);

      // Record payment
      await this.recordPayment({
        user_id: userId,
        transaction_id: subscription.id,
        provider: 'stripe',
        amount: tier.price,
        currency: 'USD',
        status: 'completed',
        tier_id: tierId,
      });

      return {
        subscription_id: subscription.id,
        status: subscription.status,
        tier: tierId,
      };
    } catch (error: any) {
      logger.error('Stripe subscription error:', error);
      throw new AppError('Failed to create subscription', 500);
    }
  }

  // ==================== M-PESA ====================
  async createMpesaSubscription(
    userId: string,
    tierId: string,
    phoneNumber: string
  ): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const tier = this.tiers[tierId as keyof typeof this.tiers];
    if (!tier) {
      throw new AppError('Invalid subscription tier', 400);
    }

    try {
      // Get M-Pesa access token
      const auth = Buffer.from(
        `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
      ).toString('base64');

      const tokenResponse = await axios.get(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        { headers: { Authorization: `Basic ${auth}` } }
      );

      const accessToken = tokenResponse.data.access_token;

      // Convert USD to KES (approximate rate)
      const amountKES = Math.ceil(tier.price * 130);

      // Initiate STK Push
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const password = Buffer.from(
        `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
      ).toString('base64');

      const stkResponse = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        {
          BusinessShortCode: process.env.MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: amountKES,
          PartyA: phoneNumber,
          PartyB: process.env.MPESA_SHORTCODE,
          PhoneNumber: phoneNumber,
          CallBackURL: process.env.MPESA_CALLBACK_URL,
          AccountReference: `SUB-${userId}`,
          TransactionDesc: `${tier.name} Subscription`,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      // Record pending payment
      const payment = await this.recordPayment({
        user_id: userId,
        transaction_id: stkResponse.data.CheckoutRequestID,
        provider: 'mpesa',
        amount: amountKES,
        currency: 'KES',
        status: 'pending',
        tier_id: tierId,
        metadata: { phone_number: phoneNumber },
      });

      return {
        transaction_id: payment.transaction_id,
        status: 'pending',
        message: 'Check your phone for M-Pesa prompt',
      };
    } catch (error: any) {
      logger.error('M-Pesa subscription error:', error);
      throw new AppError('Failed to initiate M-Pesa payment', 500);
    }
  }

  // ==================== PAYSTACK ====================
  async createPaystackSubscription(
    userId: string,
    tierId: string,
    email: string
  ): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const tier = this.tiers[tierId as keyof typeof this.tiers];
    if (!tier) {
      throw new AppError('Invalid subscription tier', 400);
    }

    try {
      // Initialize Paystack transaction
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount: tier.price * 100 * 415, // Convert to kobo (NGN)
          currency: 'NGN',
          reference: `SUB-${userId}-${Date.now()}`,
          callback_url: `${process.env.API_URL}/api/payments/paystack/callback`,
          metadata: {
            user_id: userId,
            tier_id: tierId,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      // Record pending payment
      await this.recordPayment({
        user_id: userId,
        transaction_id: response.data.data.reference,
        provider: 'paystack',
        amount: tier.price * 415,
        currency: 'NGN',
        status: 'pending',
        tier_id: tierId,
      });

      return {
        authorization_url: response.data.data.authorization_url,
        reference: response.data.data.reference,
      };
    } catch (error: any) {
      logger.error('Paystack subscription error:', error);
      throw new AppError('Failed to initialize Paystack payment', 500);
    }
  }

  // ==================== PAYMENT STATUS ====================
  async getPaymentStatus(transactionId: string): Promise<any> {
    const payment = await this.paymentRepository.findOne({
      where: { transaction_id: transactionId },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    return {
      transaction_id: payment.transaction_id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider,
      created_at: payment.created_at,
    };
  }

  // ==================== CANCEL SUBSCRIPTION ====================
  async cancelSubscription(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Cancel Stripe subscription if exists
    if (user.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(user.stripe_subscription_id);
      } catch (error) {
        logger.error('Stripe cancellation error:', error);
      }
    }

    // Downgrade to free tier
    user.subscription_tier = 'free';
    user.subscription_expires_at = undefined;
    user.stripe_subscription_id = undefined;
    await this.userRepository.save(user);
  }

  // ==================== HELPER METHODS ====================
  private async recordPayment(data: {
    user_id: string;
    transaction_id: string;
    provider: string;
    amount: number;
    currency: string;
    status: string;
    tier_id: string;
    metadata?: any;
  }): Promise<Payment> {
    const payment = this.paymentRepository.create(data);
    await this.paymentRepository.save(payment);
    return payment;
  }

  async completePayment(transactionId: string): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { transaction_id: transactionId },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    payment.status = 'completed';
    payment.completed_at = new Date();
    await this.paymentRepository.save(payment);

    // Update user subscription
    const user = await this.userRepository.findOne({ where: { id: payment.user_id } });
    if (user) {
      user.subscription_tier = payment.tier_id;
      user.subscription_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await this.userRepository.save(user);
    }
  }
}
