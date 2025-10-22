import { Response } from 'express';
import { AuthRequest } from '../types';
import { PaymentService } from '../services/payment.service';

const paymentService = new PaymentService();

export class PaymentController {
  async createStripeSubscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tierId, paymentMethodId } = req.body;
      const result = await paymentService.createStripeSubscription(
        req.user!.id,
        tierId,
        paymentMethodId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async createMpesaSubscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tierId, phoneNumber } = req.body;
      const result = await paymentService.createMpesaSubscription(
        req.user!.id,
        tierId,
        phoneNumber
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async createPaystackSubscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tierId, email } = req.body;
      const result = await paymentService.createPaystackSubscription(
        req.user!.id,
        tierId,
        email
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getPaymentStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const status = await paymentService.getPaymentStatus(transactionId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async cancelSubscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      await paymentService.cancelSubscription(req.user!.id);

      res.json({
        success: true,
        message: 'Subscription cancelled successfully',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Webhook handlers
  async mpesaCallback(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { Body } = req.body;
      const { stkCallback } = Body;

      if (stkCallback.ResultCode === 0) {
        // Payment successful
        const checkoutRequestId = stkCallback.CheckoutRequestID;
        await paymentService.completePayment(checkoutRequestId);
      }

      res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } catch (error: any) {
      res.status(500).json({ ResultCode: 1, ResultDesc: 'Failed' });
    }
  }

  async paystackCallback(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { reference } = req.query;
      if (reference) {
        await paymentService.completePayment(reference as string);
      }

      res.redirect(`${process.env.FRONTEND_URL}/payment/success`);
    } catch (error: any) {
      res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
    }
  }
}
