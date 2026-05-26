import { z } from 'zod';
import { parse as csvParse } from 'csv-parse/sync';
import { Lead } from '../models/Lead.js';
import { Activity } from '../models/Activity.js';
import { PipelineStage } from '../models/PipelineStage.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { recomputeScore } from '../services/leadScore.service.js';

const oid = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createLeadSchema = z.object({
  companyName: z.string().min(2),
  contactName: z.string().min(2),
  designation: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  location: z
    .object({ city: z.string().optional(), state: z.string().optional(), country: z.string().optional() })
    .optional(),
  industryVertical: z.string().optional(),
  source: oid.optional().nullable(),
  productInterest: z.array(oid).optional().default([]),
  estimatedValue: z.number().nonnegative().optional().default(0),
  expectedCloseDate: z.string().optional().nullable(),
  stage: oid.optional(),
  owner: oid.optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

const scopeQueryForRole = (user) => {
  if (user.role === 'bda') return { owner: user._id };
  if (user.role === 'manager') {
    return {}; // simplified: managers see all; could scope to team via managerId chain
  }
  return {};
};

export const listLeads = asyncHandler(async (req, res) => {
  const { stage, owner, source, q, vertical, stuck, page = 1, limit = 50, sort = '-createdAt' } =
    req.query;

  const filter = { isArchived: false, ...scopeQueryForRole(req.user) };
  if (stage) filter.stage = stage;
  if (owner && req.user.role !== 'bda') filter.owner = owner;
  if (source) filter.source = source;
  if (vertical) filter.industryVertical = vertical;
  if (q) {
    filter.$or = [
      { companyName: { $regex: q, $options: 'i' } },
      { contactName: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
    ];
  }
  if (stuck === '1') {
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    filter.lastActivityAt = { $lt: cutoff };
    filter.status = 'active';
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Lead.find(filter)
      .populate('stage', 'name color order')
      .populate('owner', 'name email avatarUrl')
      .populate('source', 'name')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Lead.countDocuments(filter),
  ]);

  res.json({ items, total, page: Number(page), limit: Number(limit) });
});

export const getLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .populate('stage')
    .populate('owner', 'name email avatarUrl role')
    .populate('source', 'name')
    .populate('productInterest', 'name sku unit defaultPrice')
    .populate('stageHistory.stage', 'name color')
    .populate('stageHistory.by', 'name avatarUrl')
    .lean();
  if (!lead) throw ApiError.notFound();
  if (req.user.role === 'bda' && String(lead.owner._id) !== String(req.user._id))
    throw ApiError.forbidden();
  res.json({ lead });
});

const ensureDefaultStage = async () => {
  const s = await PipelineStage.findOne({ isActive: true }).sort({ order: 1 });
  if (!s) throw ApiError.badRequest('No pipeline stages configured');
  return s;
};

export const createLead = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.expectedCloseDate === '') body.expectedCloseDate = null;
  if (body.email === '') delete body.email;
  if (!body.stage) {
    const s = await ensureDefaultStage();
    body.stage = s._id;
  }
  if (!body.owner) body.owner = req.user._id;
  if (req.user.role === 'bda') body.owner = req.user._id;

  body.stageHistory = [{ stage: body.stage, enteredAt: new Date(), by: req.user._id }];
  body.lastActivityAt = new Date();

  const lead = await Lead.create(body);
  await AuditLog.create({
    actor: req.user._id,
    action: 'lead.create',
    entityType: 'Lead',
    entityId: lead._id,
    after: lead.toObject(),
  });
  await recomputeScore(lead._id);

  if (String(body.owner) !== String(req.user._id)) {
    await Notification.create({
      user: body.owner,
      type: 'lead_assigned',
      title: 'New lead assigned',
      body: `${body.companyName} has been assigned to you.`,
      link: `/leads/${lead._id}`,
    });
  }

  const populated = await Lead.findById(lead._id)
    .populate('stage owner source')
    .lean();
  res.status(201).json({ lead: populated });
});

export const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) throw ApiError.notFound();
  if (req.user.role === 'bda' && String(lead.owner) !== String(req.user._id))
    throw ApiError.forbidden();

  const before = lead.toObject();
  Object.assign(lead, req.body);
  await lead.save();

  await AuditLog.create({
    actor: req.user._id,
    action: 'lead.update',
    entityType: 'Lead',
    entityId: lead._id,
    before,
    after: lead.toObject(),
  });
  await recomputeScore(lead._id);
  const populated = await Lead.findById(lead._id).populate('stage owner source').lean();
  res.json({ lead: populated });
});

export const moveStageSchema = z.object({ stage: oid });

export const moveStage = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) throw ApiError.notFound();
  if (req.user.role === 'bda' && String(lead.owner) !== String(req.user._id))
    throw ApiError.forbidden();

  const newStage = await PipelineStage.findById(req.body.stage);
  if (!newStage) throw ApiError.badRequest('Invalid stage');

  const oldStageId = lead.stage;
  lead.stage = newStage._id;
  lead.stageHistory.push({ stage: newStage._id, enteredAt: new Date(), by: req.user._id });
  lead.lastActivityAt = new Date();
  if (newStage.isTerminal) {
    const name = newStage.name.toLowerCase();
    if (name.includes('won')) lead.status = 'won';
    else if (name.includes('lost')) lead.status = 'lost';
    else if (name.includes('hold')) lead.status = 'onhold';
  } else {
    lead.status = 'active';
  }
  await lead.save();

  await Activity.create({
    lead: lead._id,
    type: 'stage_change',
    body: `Moved to ${newStage.name}`,
    occurredAt: new Date(),
    performedBy: req.user._id,
    meta: { from: oldStageId, to: newStage._id },
  });

  await AuditLog.create({
    actor: req.user._id,
    action: 'lead.stage_move',
    entityType: 'Lead',
    entityId: lead._id,
    before: { stage: oldStageId },
    after: { stage: newStage._id },
  });

  await recomputeScore(lead._id);
  const populated = await Lead.findById(lead._id).populate('stage owner source').lean();
  res.json({ lead: populated });
});

export const assignSchema = z.object({ owner: oid });

export const assignLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) throw ApiError.notFound();
  const oldOwner = lead.owner;
  lead.owner = req.body.owner;
  await lead.save();

  await Notification.create({
    user: req.body.owner,
    type: 'lead_assigned',
    title: 'Lead assigned to you',
    body: `${lead.companyName} has been assigned to you.`,
    link: `/leads/${lead._id}`,
  });

  await AuditLog.create({
    actor: req.user._id,
    action: 'lead.assign',
    entityType: 'Lead',
    entityId: lead._id,
    before: { owner: oldOwner },
    after: { owner: lead.owner },
  });

  const populated = await Lead.findById(lead._id).populate('stage owner source').lean();
  res.json({ lead: populated });
});

export const archiveLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndUpdate(req.params.id, { isArchived: true }, { new: true });
  if (!lead) throw ApiError.notFound();
  res.json({ ok: true });
});

export const bulkImport = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('CSV file required');
  const records = csvParse(req.file.buffer.toString('utf8'), { columns: true, skip_empty_lines: true });
  const defaultStage = await ensureDefaultStage();
  const results = { inserted: 0, failed: [] };

  for (const [i, row] of records.entries()) {
    try {
      if (!row.companyName || !row.contactName) {
        results.failed.push({ row: i + 2, error: 'Missing companyName or contactName' });
        continue;
      }
      await Lead.create({
        companyName: row.companyName,
        contactName: row.contactName,
        designation: row.designation,
        email: row.email || undefined,
        phone: row.phone,
        location: { city: row.city, state: row.state, country: row.country || 'India' },
        industryVertical: row.industryVertical,
        estimatedValue: Number(row.estimatedValue || 0),
        stage: defaultStage._id,
        owner: req.user._id,
        stageHistory: [{ stage: defaultStage._id, enteredAt: new Date(), by: req.user._id }],
        lastActivityAt: new Date(),
      });
      results.inserted += 1;
    } catch (err) {
      results.failed.push({ row: i + 2, error: err.message });
    }
  }
  res.json(results);
});
