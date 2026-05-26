import { Notification } from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const items = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const unread = items.filter((n) => !n.isRead).length;
  res.json({ items, unread });
});

export const markRead = asyncHandler(async (req, res) => {
  await Notification.updateOne(
    { _id: req.params.id, user: req.user._id },
    { $set: { isRead: true } }
  );
  res.json({ ok: true });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
  res.json({ ok: true });
});
