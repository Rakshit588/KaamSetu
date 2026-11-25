import { Notification } from '../models/Notification.js';
import { createNotificationProvider } from '../providers/notification.js';
import { emitUser } from '../realtime/io.js';

const provider = createNotificationProvider();

export async function notify(
  userId: string,
  type: string,
  title: string,
  body: string,
  data: Record<string, string> = {},
) {
  const doc = await Notification.create({ userId, type, title, body, data });
  await provider.send(userId, title, body, data);
  emitUser(userId, 'notification:new', {
    id: String(doc._id),
    type,
    title,
    body,
    data,
  });
  return doc;
}
