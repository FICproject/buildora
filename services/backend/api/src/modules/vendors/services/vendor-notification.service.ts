import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { VendorNotification } from '@buildora/types';

export type VendorNotificationType =
  | 'REGISTRATION_SUCCESS'
  | 'EMAIL_VERIFIED'
  | 'MOBILE_VERIFIED'
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_UNDER_REVIEW'
  | 'DOCUMENTS_REQUESTED'
  | 'APPLICATION_APPROVED'
  | 'APPLICATION_REJECTED'
  | 'ACCOUNT_SUSPENDED'
  | 'PASSWORD_RESET'
  | 'ORDER'
  | 'STOCK'
  | 'SETTLEMENT';

export interface EmailMessagePayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SmsMessagePayload {
  phone: string;
  message: string;
}

export interface OtpDeliveryResult {
  delivered: boolean;
  provider: string;
  reason?: string;
  missingEnvVars?: string[];
}

@Injectable()
export class VendorNotificationService {
  private readonly logger = new Logger(VendorNotificationService.name);

  // In-memory notifications store per vendor
  private notifications: Map<string, VendorNotification[]> = new Map();

  /**
   * Reports Email & SMS OTP provider configuration readiness without exposing secrets.
   */
  getOtpProviderStatus() {
    const hasSendGrid = Boolean(process.env.SENDGRID_API_KEY);
    const hasResend = Boolean(process.env.RESEND_API_KEY);
    const hasEmailFrom = Boolean(process.env.EMAIL_FROM || process.env.SMTP_FROM);
    const emailConfigured = (hasSendGrid || hasResend) && hasEmailFrom;

    const hasTwilio = Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER
    );
    const hasMsg91 = Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID);
    const smsConfigured = hasTwilio || hasMsg91;

    const missingEmailEnv: string[] = [];
    if (!hasSendGrid && !hasResend) missingEmailEnv.push('SENDGRID_API_KEY or RESEND_API_KEY');
    if (!hasEmailFrom) missingEmailEnv.push('EMAIL_FROM');

    const missingSmsEnv: string[] = [];
    if (!hasTwilio && !hasMsg91) {
      missingSmsEnv.push(
        'TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_PHONE_NUMBER (or MSG91_AUTH_KEY + MSG91_TEMPLATE_ID)'
      );
    }

    return {
      emailConfigured,
      emailProvider: hasSendGrid ? 'SENDGRID' : hasResend ? 'RESEND' : 'DUMMY_OTP',
      missingEmailEnv,
      smsConfigured,
      smsProvider: hasTwilio ? 'TWILIO' : hasMsg91 ? 'MSG91' : 'DUMMY_OTP',
      missingSmsEnv,
      devOtpFallbackEnabled:
        process.env.STRICT_OTP_PROVIDERS !== 'true' &&
        (!emailConfigured || !smsConfigured || process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_OTP_FALLBACK === 'true')
    };
  }

  /**
   * Dispatches a notification across in-app, email, and SMS channels.
   */
  async notify(
    vendorId: string,
    type: VendorNotificationType,
    title: string,
    message: string,
    actionUrl?: string,
    recipientContact?: { email?: string; phone?: string }
  ): Promise<VendorNotification> {
    const notif: VendorNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      vendorId,
      type: type === 'ORDER' || type === 'STOCK' || type === 'SETTLEMENT' ? type : 'SYSTEM',
      title,
      message,
      read: false,
      actionUrl: actionUrl || '/notifications',
      createdAt: new Date().toISOString()
    };

    const list = this.notifications.get(vendorId) || [];
    list.unshift(notif);
    this.notifications.set(vendorId, list);

    if (recipientContact?.email) {
      await this.sendEmail({
        to: recipientContact.email,
        subject: `[BUILDORA 60] ${title}`,
        html: `<p><strong>${title}</strong></p><p>${message}</p>`
      });
    }

    if (recipientContact?.phone) {
      await this.sendSms({
        phone: recipientContact.phone,
        message: `[BUILDORA 60] ${title}: ${message}`
      });
    }

    return notif;
  }

  getVendorNotifications(vendorId: string): VendorNotification[] {
    return this.notifications.get(vendorId) || [];
  }

  markAsRead(vendorId: string, notifId: string): boolean {
    const list = this.notifications.get(vendorId);
    if (!list) return false;
    const item = list.find((n) => n.id === notifId);
    if (item) {
      item.read = true;
      return true;
    }
    return false;
  }

  markAllAsRead(vendorId: string): boolean {
    const list = this.notifications.get(vendorId);
    if (!list) return false;
    list.forEach((n) => (n.read = true));
    return true;
  }

  /**
   * Sends a registration/auth OTP verification email using configured SendGrid or Resend provider.
   * Never silently fakes delivery in strict production mode when credentials are missing.
   */
  async sendOtpEmail(email: string, otp: string): Promise<OtpDeliveryResult> {
    const result = await this.sendEmail({
      to: email,
      subject: 'BUILDORA 60 — Business Email Verification Code',
      text: `Your BUILDORA 60 verification code is ${otp}. Valid for 10 minutes. Do not share this code with anyone.`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#203D91;margin:0 0 8px;">BUILDORA 60 Vendor Verification</h2>
          <p style="color:#334155;font-size:14px;">Use the verification code below to verify your official business email address:</p>
          <div style="margin:20px 0;padding:16px;background:#f4f7fc;border-radius:10px;text-align:center;font-size:28px;font-weight:800;letter-spacing:6px;color:#17233C;">
            ${otp}
          </div>
          <p style="color:#64748b;font-size:12px;margin:0;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
        </div>
      `
    });

    const strictProd = process.env.STRICT_OTP_PROVIDERS === 'true';
    if (!result.delivered) {
      if (strictProd) {
        throw new ServiceUnavailableException(
          'Unable to send verification code. Email provider credentials are not configured on the server.'
        );
      }
      this.logger.log(`[Dummy Email OTP Mode] Generated code for ${email}.`);
      return { delivered: true, provider: 'DUMMY_OTP' };
    }
    return result;
  }

  /**
   * Sends a registration/auth OTP SMS using configured Twilio or MSG91 provider.
   * Falls back to dummy OTP mode until real SMS credentials are configured or STRICT_OTP_PROVIDERS=true.
   */
  async sendOtpSms(phone: string, otp: string): Promise<OtpDeliveryResult> {
    const result = await this.sendSms({
      phone,
      message: `Your BUILDORA 60 verification OTP is ${otp}. Valid for 10 minutes. Do not share it with anyone.`,
      otp
    } as any);

    const strictProd = process.env.STRICT_OTP_PROVIDERS === 'true';
    if (!result.delivered) {
      if (strictProd) {
        throw new ServiceUnavailableException(
          'Unable to send OTP to this mobile number. SMS provider credentials are not configured on the server.'
        );
      }
      this.logger.log(`[Dummy SMS OTP Mode] Generated code for +91 ${phone}.`);
      return { delivered: true, provider: 'DUMMY_OTP' };
    }
    return result;
  }

  private async sendEmail(payload: EmailMessagePayload): Promise<OtpDeliveryResult> {
    const sendgridKey = process.env.SENDGRID_API_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_FROM;

    if ((!sendgridKey && !resendKey) || !fromAddress) {
      const missingEnvVars: string[] = [];
      if (!sendgridKey && !resendKey) missingEnvVars.push('SENDGRID_API_KEY or RESEND_API_KEY');
      if (!fromAddress) missingEnvVars.push('EMAIL_FROM');

      this.logger.warn(
        `[Email Provider Unconfigured] Missing ${missingEnvVars.join(', ')}. Could not dispatch external email to ${payload.to}.`
      );
      return {
        delivered: false,
        provider: 'UNCONFIGURED',
        reason: `Missing environment variables: ${missingEnvVars.join(', ')}`,
        missingEnvVars
      };
    }

    try {
      if (sendgridKey) {
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sendgridKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: payload.to }] }],
            from: { email: fromAddress, name: 'BUILDORA 60' },
            subject: payload.subject,
            content: [
              ...(payload.text ? [{ type: 'text/plain', value: payload.text }] : []),
              { type: 'text/html', value: payload.html }
            ]
          }),
          signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          this.logger.error(`SendGrid API error (${res.status}): ${errText}`);
          throw new ServiceUnavailableException('Unable to send verification code. Please try again.');
        }
        return { delivered: true, provider: 'SENDGRID' };
      }

      if (resendKey) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [payload.to],
            subject: payload.subject,
            html: payload.html,
            text: payload.text
          }),
          signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          this.logger.error(`Resend API error (${res.status}): ${errText}`);
          throw new ServiceUnavailableException('Unable to send verification code. Please try again.');
        }
        return { delivered: true, provider: 'RESEND' };
      }
    } catch (err: any) {
      if (err instanceof ServiceUnavailableException) throw err;
      this.logger.error(`Email provider network failure: ${err.message}`);
      throw new ServiceUnavailableException('Unable to send verification code. Please try again.');
    }

    return { delivered: false, provider: 'UNCONFIGURED' };
  }

  private async sendSms(payload: SmsMessagePayload & { otp?: string }): Promise<OtpDeliveryResult> {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
    const msg91Key = process.env.MSG91_AUTH_KEY;
    const msg91TemplateId = process.env.MSG91_TEMPLATE_ID;

    const hasTwilio = Boolean(twilioSid && twilioToken && twilioFrom);
    const hasMsg91 = Boolean(msg91Key && msg91TemplateId);

    if (!hasTwilio && !hasMsg91) {
      const missingEnvVars = [
        'TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_PHONE_NUMBER (or MSG91_AUTH_KEY + MSG91_TEMPLATE_ID)'
      ];
      this.logger.warn(
        `[SMS Provider Unconfigured] Missing SMS gateway env vars. Could not dispatch external SMS to ${payload.phone}.`
      );
      return {
        delivered: false,
        provider: 'UNCONFIGURED',
        reason: `Missing environment variables: ${missingEnvVars.join(', ')}`,
        missingEnvVars
      };
    }

    const e164Phone = payload.phone.startsWith('+') ? payload.phone : `+91${payload.phone}`;

    try {
      if (hasTwilio && twilioSid && twilioToken && twilioFrom) {
        const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        const form = new URLSearchParams({
          To: e164Phone,
          From: twilioFrom,
          Body: payload.message
        });
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: form.toString(),
            signal: AbortSignal.timeout(10000)
          }
        );
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          this.logger.error(`Twilio SMS API error (${res.status}): ${errText}`);
          throw new ServiceUnavailableException('Unable to send OTP to this mobile number.');
        }
        return { delivered: true, provider: 'TWILIO' };
      }

      if (hasMsg91 && msg91Key && msg91TemplateId) {
        const res = await fetch('https://control.msg91.com/api/v5/otp', {
          method: 'POST',
          headers: {
            authkey: msg91Key,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            template_id: msg91TemplateId,
            mobile: e164Phone.replace(/^\+/, ''),
            otp: payload.otp
          }),
          signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          this.logger.error(`MSG91 SMS API error (${res.status}): ${errText}`);
          throw new ServiceUnavailableException('Unable to send OTP to this mobile number.');
        }
        return { delivered: true, provider: 'MSG91' };
      }
    } catch (err: any) {
      if (err instanceof ServiceUnavailableException) throw err;
      this.logger.error(`SMS provider network failure: ${err.message}`);
      throw new ServiceUnavailableException('Unable to send OTP to this mobile number.');
    }

    return { delivered: false, provider: 'UNCONFIGURED' };
  }
}

export const vendorNotificationService = new VendorNotificationService();
