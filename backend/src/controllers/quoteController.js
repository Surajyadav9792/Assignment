import { z } from 'zod';
import { Quote } from '../models/Quote.js';
import { Lead } from '../models/Lead.js';
import { Activity } from '../models/Activity.js';
import { PipelineStage } from '../models/PipelineStage.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { streamQuotePdf } from '../services/pdf.service.js';

const oid = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const itemSchema = z.object({
  product: oid.optional().nullable(),
  productName: z.string(),
  sku: z.string().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discountPct: z.number().min(0).max(100).optional().default(0),
});

export const createQuoteSchema = z.object({
  lead: oid,
  items: z.array(itemSchema).min(1),
  taxPct: z.number().min(0).max(50).optional().default(18),
  notes: z.string().optional(),
  validUntil: z.string().optional().nullable(),
});

const computeTotals = (items, taxPct = 18) => {
  let subtotal = 0;
  const out = items.map((it) => {
    const gross = it.unitPrice * it.quantity;
    const disc = (gross * (it.discountPct || 0)) / 100;
    const total = +(gross - disc).toFixed(2);
    subtotal += total;
    return { ...it, total };
  });
  subtotal = +subtotal.toFixed(2);
  const taxAmount = +((subtotal * taxPct) / 100).toFixed(2);
  const grandTotal = +(subtotal + taxAmount).toFixed(2);
  return { items: out, subtotal, taxAmount, grandTotal };
};

const generateQuoteNumber = async () => {
  const year = new Date().getFullYear();
  const last = await Quote.findOne({ quoteNumber: { $regex: `^QT-${year}-` } })
    .sort({ createdAt: -1 })
    .lean();
  let n = 1;
  if (last) {
    const m = last.quoteNumber.match(/-(\d+)$/);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return `QT-${year}-${String(n).padStart(5, '0')}`;
};

const scopeQuotesForRole = async (user) => {
  if (user.role === 'bda') {
    const leads = await Lead.find({ owner: user._id }).select('_id').lean();
    return { lead: { $in: leads.map((l) => l._id) } };
  }
  return {};
};

export const listQuotes = asyncHandler(async (req, res) => {
  const filter = await scopeQuotesForRole(req.user);
  if (req.query.status) filter.status = req.query.status;
  if (req.query.lead) filter.lead = req.query.lead;
  const items = await Quote.find(filter)
    .populate('lead', 'companyName owner')
    .populate('createdBy', 'name avatarUrl')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ items });
});

export const getQuote = asyncHandler(async (req, res) => {
  const q = await Quote.findById(req.params.id)
    .populate('lead')
    .populate('createdBy', 'name avatarUrl')
    .lean();
  if (!q) throw ApiError.notFound();
  if (req.user.role === 'bda' && String(q.lead.owner) !== String(req.user._id))
    throw ApiError.forbidden();
  res.json({ quote: q });
});

export const createQuote = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.body.lead);
  if (!lead) throw ApiError.badRequest('Lead not found');
  if (req.user.role === 'bda' && String(lead.owner) !== String(req.user._id))
    throw ApiError.forbidden();

  const totals = computeTotals(req.body.items, req.body.taxPct);
  const quoteNumber = await generateQuoteNumber();
  const q = await Quote.create({
    ...req.body,
    ...totals,
    quoteNumber,
    createdBy: req.user._id,
  });
  res.status(201).json({ quote: q });
});

export const updateQuote = asyncHandler(async (req, res) => {
  const q = await Quote.findById(req.params.id);
  if (!q) throw ApiError.notFound();
  if (q.status !== 'draft' && q.status !== 'revised')
    throw ApiError.badRequest('Cannot edit a quote that is already sent');

  if (req.body.items) {
    const totals = computeTotals(req.body.items, req.body.taxPct ?? q.taxPct);
    Object.assign(q, req.body, totals);
  } else {
    Object.assign(q, req.body);
  }
  await q.save();
  res.json({ quote: q });
});

export const sendQuote = asyncHandler(async (req, res) => {
  const q = await Quote.findById(req.params.id).populate('lead');
  if (!q) throw ApiError.notFound();
  q.status = 'sent';
  q.sentAt = new Date();
  await q.save();

  const lead = await Lead.findById(q.lead._id);
  const quotedStage = await PipelineStage.findOne({ name: 'Quoted' });
  if (quotedStage && lead) {
    const currentStage = await PipelineStage.findById(lead.stage);
    if (currentStage && currentStage.order < quotedStage.order) {
      lead.stage = quotedStage._id;
      lead.stageHistory.push({ stage: quotedStage._id, enteredAt: new Date(), by: req.user._id });
    }
    lead.lastActivityAt = new Date();
    await lead.save();
  }

  await Activity.create({
    lead: q.lead._id,
    type: 'quote',
    subject: `Quote sent: ${q.quoteNumber}`,
    body: `Grand total: ${q.grandTotal}`,
    occurredAt: new Date(),
    performedBy: req.user._id,
    meta: { quote: q._id, amount: q.grandTotal },
  });

  res.json({ quote: q });
});

export const pdfQuote = asyncHandler(async (req, res) => {
  const q = await Quote.findById(req.params.id).populate('lead');
  if (!q) throw ApiError.notFound();
  streamQuotePdf(q.toObject({ getters: true }), res);
});
