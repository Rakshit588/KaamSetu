import { logger } from '../logger.js';
import { config } from '../config.js';

export interface OtpProvider {
  send(phone: string, otp: string): Promise<void>;
}

export class DevOtpProvider implements OtpProvider {
  async send(phone: string, otp: string): Promise<void> {
    logger.info({ phone, otp }, '[DEMO] OTP (always 123456 in development)');
  }
}

export class Msg91OtpProvider implements OtpProvider {
  async send(phone: string, otp: string): Promise<void> {
    if (!process.env.MSG91_AUTH_KEY) {
      logger.warn({ phone }, '[DEMO] MSG91 not configured; logging OTP instead');
      await new DevOtpProvider().send(phone, otp);
      return;
    }
    logger.info({ phone }, 'MSG91 OTP send would happen here');
  }
}

export class FirebaseOtpProvider implements OtpProvider {
  async send(phone: string, otp: string): Promise<void> {
    if (!process.env.FIREBASE_PROJECT_ID) {
      logger.warn({ phone }, '[DEMO] Firebase OTP not configured; logging OTP instead');
      await new DevOtpProvider().send(phone, otp);
      return;
    }
    logger.info({ phone }, 'Firebase OTP send would happen here');
  }
}

export function createOtpProvider(): OtpProvider {
  switch (config.otpProvider) {
    case 'msg91':
      return new Msg91OtpProvider();
    case 'firebase':
      return new FirebaseOtpProvider();
    default:
      return new DevOtpProvider();
  }
}
