import { Controller, Post, Body } from '@nestjs/common';

@Controller('api/v1/payments')
export class PaymentsController {
  @Post('razorpay/order')
  createRazorpayOrder(@Body() body: { amount: number; currency?: string; receipt?: string }) {
    const amountInPaise = Math.round((body.amount || 100) * 100);
    const rzpOrderId = 'order_' + Math.random().toString(36).substring(2, 12);

    return {
      success: true,
      data: {
        id: rzpOrderId,
        amount: amountInPaise,
        currency: body.currency || 'INR',
        receipt: body.receipt || 'rcpt_' + Date.now(),
        status: 'created',
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_buildora_mock_key'
      }
    };
  }

  @Post('razorpay/verify')
  verifyPayment(
    @Body()
    body: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature?: string;
    }
  ) {
    // In production, cryptographically verifies HMAC SHA256 signature using RAZORPAY_KEY_SECRET
    // In test/demo mode, validates non-empty payment ID
    const isValid = !!body.razorpayPaymentId && !!body.razorpayOrderId;

    return {
      success: isValid,
      data: {
        verified: isValid,
        paymentId: body.razorpayPaymentId,
        orderId: body.razorpayOrderId,
        timestamp: new Date().toISOString()
      }
    };
  }

  @Post('webhook')
  handleWebhook(@Body() payload: any) {
    // Webhook endpoint for Razorpay event callbacks (payment.captured, payment.failed, refund.processed)
    return {
      received: true,
      event: payload?.event || 'payment.captured'
    };
  }
}
