import { z } from 'zod';
import { Activity } from '../models/Activity.js';
import { Lead } from '../models/Lead.js';
import { Task } from '../models/Task.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { recomputeScore } from '../services/leadScore.service.js';

const oid = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const createActivitySchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'note', 'sample', 'quote', 'rfq', 'stage_change']),
  subject: z.string().optional(),
  body: z.string().optional(),
  outcome: z.string().optional(),
  occurredAt: z.string().optional(),
  nextFollowUp: z.string().optional().nullable(),
  mentions: z.array(oid).optional().default([]),
  meta: z.record(z.string(), z.any()).optional(),
});

export const listActivities = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.leadId).lean();
  if (!lead) throw ApiError.notFound('Lead not found');
  if (req.user.role === 'bda' && String(lead.owner) !== String(req.user._id))
    throw ApiError.forbidden();

  const items = await Activity.find({ lead: req.params.leadId })
    .populate('performedBy', 'name avatarUrl')
    .populate('mentions', 'name')
    .sort({ occurredAt: -1 })
    .lean();
  res.json({ items });
});

export const createActivity = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.leadId);
  if (!lead) throw ApiError.notFound('Lead not found');
  if (req.user.role === 'bda' && String(lead.owner) !== String(req.user._id))
    throw ApiError.forbidden();

  const a = await Activity.create({
    ...req.body,
    lead: lead._id,
    performedBy: req.user._id,
    occurredAt: req.body.occurredAt ? new Date(req.body.occurredAt) : new Date(),
    nextFollowUp: req.body.nextFollowUp ? new Date(req.body.nextFollowUp) : undefined,
  });

  lead.lastActivityAt = a.occurredAt;
  await lead.save();

  if (a.nextFollowUp) {
    await Task.create({
      title: `Follow up: ${lead.companyName}`,
      description: a.subject || a.body?.slice(0, 200),
      lead: lead._id,
      dueDate: a.nextFollowUp,
      priority: 'medium',
      assignee: req.user._id,
      createdBy: req.user._id,
    });
  }

  await recomputeScore(lead._id);

  const populated = await Activity.findById(a._id)
    .populate('performedBy', 'name avatarUrl')
    .lean();
  res.status(201).json({ activity: populated });
});
