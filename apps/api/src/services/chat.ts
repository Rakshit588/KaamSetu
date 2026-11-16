import { Message } from '../models/Message.js';
import { maybeFlagChat, sanitizeChatText } from './fraud.js';

export async function persistChatMessage(input: {
  bookingId: string;
  senderId: string;
  text: string;
}) {
  const { text, flagged } = sanitizeChatText(input.text);
  const message = await Message.create({
    bookingId: input.bookingId,
    senderId: input.senderId,
    text,
  });
  await maybeFlagChat(input.senderId, input.bookingId, flagged);
  return {
    id: String(message._id),
    bookingId: input.bookingId,
    senderId: input.senderId,
    text,
    flagged,
    createdAt: message.createdAt,
  };
}
