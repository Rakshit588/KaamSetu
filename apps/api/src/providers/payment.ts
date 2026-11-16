export interface PaymentProvider {
  name: string;
  createOrder(amountInr: number, receipt: string): Promise<{ orderId: string; demo: boolean }>;
}

export class MockUpiProvider implements PaymentProvider {
  name = 'mock_upi';
  async createOrder(amountInr: number, receipt: string) {
    return { orderId: `mock_${receipt}_${amountInr}`, demo: true };
  }
}

export class RazorpayTestProvider implements PaymentProvider {
  name = 'razorpay_test';
  async createOrder(amountInr: number, receipt: string) {
    if (!process.env.RAZORPAY_KEY_ID) {
      return new MockUpiProvider().createOrder(amountInr, receipt);
    }
    return { orderId: `rzp_test_${receipt}`, demo: true };
  }
}

export function createPaymentProvider(): PaymentProvider {
  if (process.env.RAZORPAY_KEY_ID) return new RazorpayTestProvider();
  return new MockUpiProvider();
}
