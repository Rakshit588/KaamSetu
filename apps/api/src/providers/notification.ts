import { logger } from '../logger.js';

export interface NotificationProvider {
  send(userId: string, title: string, body: string, data?: Record<string, string>): Promise<void>;
}

export class InAppNotificationProvider implements NotificationProvider {
  async send(userId: string, title: string, body: string): Promise<void> {
    logger.info({ userId, title, body }, '[DEMO] in-app notification fallback');
  }
}

export function createNotificationProvider(): NotificationProvider {
  return new InAppNotificationProvider();
}
