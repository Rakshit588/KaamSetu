import { logger } from '../logger.js';

export interface NotificationProvider {
  send(userId: string, title: string, body: string, data?: Record<string, string>): Promise<void>;
}

export class InAppNotificationProvider implements NotificationProvider {
  async send(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    logger.info(
      { userId, title, body, data },
      '[DEMO] in-app notification fallback',
    );
  }
}

export class FcmNotificationProvider implements NotificationProvider {
  async send(userId: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
    if (!process.env.FIREBASE_PROJECT_ID) {
      await new InAppNotificationProvider().send(userId, title, body, data);
      return;
    }
    logger.info({ userId, title }, '[DEMO] FCM push would be sent');
  }
}

export function createNotificationProvider(): NotificationProvider {
  if (process.env.FIREBASE_PROJECT_ID) return new FcmNotificationProvider();
  return new InAppNotificationProvider();
}
