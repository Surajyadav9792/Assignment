import { z } from 'zod';
import { Task } from '../models/Task.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const oid = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  lead: oid.optional().nullable(),
  dueDate: z.string(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignee: oid.optional(),
});

const ownTaskScope = (req) => (req.user.role === 'bda' ? { assignee: req.user._id } : {});

export const myDay = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const baseQuery = { assignee: userId, status: { $in: ['open', 'snoozed'] } };

  const [overdue, today, week] = await Promise.all([
    Task.find({ ...baseQuery, dueDate: { $lt: startOfDay } })
      .populate('lead', 'companyName')
      .sort({ dueDate: 1 })
      .lean(),
    Task.find({ ...baseQuery, dueDate: { $gte: startOfDay, $lte: endOfDay } })
      .populate('lead', 'companyName')
      .sort({ dueDate: 1 })
      .lean(),
    Task.find({ ...baseQuery, dueDate: { $gt: endOfDay, $lte: endOfWeek } })
      .populate('lead', 'companyName')
      .sort({ dueDate: 1 })
      .lean(),
  ]);
  res.json({ overdue, today, week });
});

export const listTasks = asyncHandler(async (req, res) => {
  const { status, lead, page = 1, limit = 50 } = req.query;
  const filter = { ...ownTaskScope(req) };
  if (status) filter.status = status;
  if (lead) filter.lead = lead;
  const items = await Task.find(filter)
    .populate('lead', 'companyName')
    .populate('assignee', 'name avatarUrl')
    .sort({ dueDate: 1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean();
  const total = await Task.countDocuments(filter);
  res.json({ items, total });
});

export const createTask = asyncHandler(async (req, res) => {
  const body = { ...req.body, createdBy: req.user._id };
  if (!body.assignee) body.assignee = req.user._id;
  if (req.user.role === 'bda') body.assignee = req.user._id;
  const t = await Task.create(body);
  res.status(201).json({ task: t });
});

export const updateTask = asyncHandler(async (req, res) => {
  const t = await Task.findById(req.params.id);
  if (!t) throw ApiError.notFound();
  if (req.user.role === 'bda' && String(t.assignee) !== String(req.user._id))
    throw ApiError.forbidden();
  Object.assign(t, req.body);
  await t.save();
  res.json({ task: t });
});

export const completeTask = asyncHandler(async (req, res) => {
  const t = await Task.findById(req.params.id);
  if (!t) throw ApiError.notFound();
  if (req.user.role === 'bda' && String(t.assignee) !== String(req.user._id))
    throw ApiError.forbidden();
  t.status = 'done';
  t.completedAt = new Date();
  await t.save();
  res.json({ task: t });
});

export const snoozeSchema = z.object({ until: z.string() });

export const snoozeTask = asyncHandler(async (req, res) => {
  const t = await Task.findById(req.params.id);
  if (!t) throw ApiError.notFound();
  if (req.user.role === 'bda' && String(t.assignee) !== String(req.user._id))
    throw ApiError.forbidden();
  t.status = 'snoozed';
  t.snoozeUntil = new Date(req.body.until);
  t.dueDate = new Date(req.body.until);
  await t.save();
  res.json({ task: t });
});
