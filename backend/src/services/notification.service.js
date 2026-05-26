import { Notification } from '../models/Notification.js';

export async function createNotification({ user, type, title, body, link, meta = {} }) {
  return Notification.create({ user, type, title, body, link, meta });
}
