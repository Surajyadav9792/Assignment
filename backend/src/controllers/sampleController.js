import { z } from 'zod';
import { Sample } from '../models/Sample.js';
import { Lead } from '../models/Lead.js';
import { Activity } from '../models/Activity.js';
import { PipelineStage } from '../models/PipelineStage.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const oid = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const createSampleSchema = z.object({
  lead: oid,
  product: oid.optional().nullable(),
  productName: z.string(),
  quantity: z.number().positive(),
  courier: z.string().optional(),
  awbNumber: z.string().optional(),
  status: z
    .enum(['requested', 'dispatched', 'delivered', 'feedback_received', 'approved', 'rejected'])
    .optional(),
  dispatchedAt: z.string().optional().nullable(),
  expectedFeedbackDate: z.string().optional().nullable(),
});

const scope = async (user) => {
  if (user.role === 'bda') {
    const leads = await Lead.find({ owner: user._id }).select('_id').lean();
    return { lead: { $in: leads.map((l) => l._id) } };
  }
  return {};
};

export const listSamples = asyncHandler(async (req, res) => {
  const filter = await scope(req.user);
  if (req.query.status) filter.status = req.query.status;
  if (req.query.lead) filter.lead = req.query.lead;
  const items = await Sample.find(filter)
    .populate('lead', 'companyName owner')
    .populate('createdBy', 'name avatarUrl')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ items });
});

export const createSample = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.body.lead);
  if (!lead) throw ApiError.badRequest('Lead not found');
  if (req.user.role === 'bda' && String(lead.owner) !== String(req.user._id))
    throw ApiError.forbidden();
  const s = await Sample.create({ ...req.body, createdBy: req.user._id });

  await Activity.create({
    lead: lead._id,
    type: 'sample',
    subject: `Sample requested: ${req.body.productName}`,
    body: `Quantity: ${req.body.quantity}`,
    occurredAt: new Date(),
    performedBy: req.user._id,
    meta: { sample: s._id },
  });
  lead.lastActivityAt = new Date();
  await lead.save();
  res.status(201).json({ sample: s });
});

export const updateSample = asyncHandler(async (req, res) => {
  const s = await Sample.findById(req.params.id);
  if (!s) throw ApiError.notFound();
  const prevStatus = s.status;
  Object.assign(s, req.body);
  if (req.body.status === 'dispatched' && !s.dispatchedAt) s.dispatchedAt = new Date();
  if (req.body.status === 'delivered' && !s.deliveredAt) s.deliveredAt = new Date();
  await s.save();

  if (prevStatus !== s.status) {
    const lead = await Lead.findById(s.lead);
    if (lead) {
      if (s.status === 'dispatched') {
        const stage = await PipelineStage.findOne({ name: 'Sample Sent' });
        if (stage) {
          const cur = await PipelineStage.findById(lead.stage);
          if (cur && cur.order < stage.order) {
            lead.stage = stage._id;
            lead.stageHistory.push({ stage: stage._id, enteredAt: new Date(), by: req.user._id });
          }
        }
      } else if (s.status === 'approved') {
        const stage = await PipelineStage.findOne({ name: 'Sample Approved' });
        if (stage) {
          const cur = await PipelineStage.findById(lead.stage);
          if (cur && cur.order < stage.order) {
            lead.stage = stage._id;
            lead.stageHistory.push({ stage: stage._id, enteredAt: new Date(), by: req.user._id });
          }
        }
      }
      lead.lastActivityAt = new Date();
      await lead.save();
    }
  }

  res.json({ sample: s });
});
