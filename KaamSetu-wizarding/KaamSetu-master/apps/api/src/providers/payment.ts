import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { logger } from '../logger.js';

export type PaymentOrder = {
  orderId: string;
  demo: boolean;
  provider: string;
  amountInr: number;
};

export interface PaymentProvider {
  name: string;
  demo: boolean;
  createOrder(amountInr: number, receipt: string): Promise<PaymentOrder>;
  capture(orderId: string): Promise<{ status: 'captured' | 'failed'; demo: boolean }>;
  payout(params: {
    workerUserId: string;
    amountInr: number;
    bookingId: string;
  }): Promise<{ payoutId: string; demo: boolean }>;
}

export class MockUpiProvider implements PaymentProvider {
  name = 'mock_upi';
  demo = true;
  async createOrder(amountInr: number, receipt: string): Promise<PaymentOrder> {
    return {
      orderId: `mock_${receipt}_${amountInr}`,
      demo: true,
      provider: this.name,
      amountInr,
    };
  }
  async capture(_orderId: string) {
    return { status: 'captured' as const, demo: true };
  }
  async payout(params: { workerUserId: string; amountInr: number; bookingId: string }) {
    return { payoutId: `payout_${params.bookingId}_${params.amountInr}`, demo: true };
  }
}

export class RazorpayTestProvider implements PaymentProvider {
  name = 'razorpay_test';
  demo = true;
  async createOrder(amountInr: number, receipt: string): Promise<PaymentOrder> {
    if (!config.razorpayKeyId) {
      logger.warn('RAZORPAY_KEY_ID missing; falling back to Mock UPI');
      return new MockUpiProvider().createOrder(amountInr, receipt);
    }
    return {
      orderId: `order_test_${randomUUID().slice(0, 8)}_${receipt}`,
      demo: true,
      provider: this.name,
      amountInr,
    };
  }
  async capture(orderId: string) {
    logger.info({ orderId }, '[DEMO] Razorpay test capture');
    return { status: 'captured' as const, demo: true };
  }
  async payout(params: { workerUserId: string; amountInr: number; bookingId: string }) {
    logger.info(params, '[DEMO] Razorpay test payout');
    return { payoutId: `rfnd_test_${params.bookingId}`, demo: true };
  }
}

export function createPaymentProvider(): PaymentProvider {
  if (config.paymentProvider === 'razorpay' || config.razorpayKeyId) {
    return new RazorpayTestProvider();
  }
  return new MockUpiProvider();
}
