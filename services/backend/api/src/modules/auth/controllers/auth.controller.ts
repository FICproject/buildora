import { Controller, Post, Get, Body, Headers, UnauthorizedException } from '@nestjs/common';

@Controller('api/v1/auth')
export class AuthController {
  @Post('request-otp')
  requestOtp(@Body() body: { phone: string }) {
    const cleanPhone = (body.phone || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return {
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number.'
      };
    }

    return {
      success: true,
      message: 'OTP sent successfully to +91 ' + cleanPhone,
      devOtpHint: '6060'
    };
  }

  @Post('verify-otp')
  verifyOtp(@Body() body: { phone: string; otp: string }) {
    const { phone, otp } = body;
    if (!phone || !otp) {
      throw new UnauthorizedException('Phone and OTP are required');
    }

    if (otp !== '6060' && otp.length !== 4) {
      throw new UnauthorizedException('Invalid OTP. Use test OTP 6060.');
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    const user = {
      id: 'cust-' + cleanPhone,
      name: 'Arjun Verma',
      phone: cleanPhone,
      email: 'arjun.verma@buildora.com',
      isPhoneVerified: true,
      isEmailVerified: true,
      gstin: '29AABCB1234F1Z8',
      businessName: 'Apex Infra Construction Ltd',
      walletBalance: 1250,
      rewardPoints: 480,
      role: 'CONTRACTOR',
      createdAt: new Date().toISOString()
    };

    const token = 'jwt-buildora-token-' + cleanPhone + '-' + Date.now();

    return {
      success: true,
      message: 'Authentication successful',
      token,
      user
    };
  }

  @Get('session')
  getSession(@Headers('authorization') authHeader?: string) {
    if (!authHeader) {
      return {
        authenticated: false,
        user: null
      };
    }

    return {
      authenticated: true,
      user: {
        id: 'cust-demo-1',
        name: 'Arjun Verma',
        phone: '9876543210',
        email: 'arjun.verma@buildora.com',
        isPhoneVerified: true,
        gstin: '29AABCB1234F1Z8',
        businessName: 'Apex Infra Construction Ltd',
        walletBalance: 1250,
        rewardPoints: 480
      }
    };
  }

  @Post('logout')
  logout() {
    return {
      success: true,
      message: 'Logged out successfully'
    };
  }
}
