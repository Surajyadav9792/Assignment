import { z } from 'zod';
import { Product } from '../models/Product.js';
import { PipelineStage } from '../models/PipelineStage.js';
import { LeadSource } from '../models/LeadSource.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

export const productSchema = z.object({
  sku: z.string().min(2),
  name: z.string().min(2),
  category: z.string().optional(),
  defaultPrice: z.number().nonnegative().optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const listProducts = asyncHandler(async (_req, res) => {
  const items = await Product.find().sort({ name: 1 }).lean();
  res.json({ items });
});
export const createProduct = asyncHandler(async (req, res) => {
  const p = await Product.create(req.body);
  res.status(201).json({ product: p });
});
export const updateProduct = asyncHandler(async (req, res) => {
  const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!p) throw ApiError.notFound();
  res.json({ product: p });
});
export const deleteProduct = asyncHandler(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export const stageSchema = z.object({
  name: z.string().min(2),
  order: z.number().int().nonnegative(),
  probability: z.number().min(0).max(100).optional(),
  color: z.string().optional(),
  isTerminal: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const listStages = asyncHandler(async (_req, res) => {
  const items = await PipelineStage.find().sort({ order: 1 }).lean();
  res.json({ items });
});
export const createStage = asyncHandler(async (req, res) => {
  const s = await PipelineStage.create(req.body);
  res.status(201).json({ stage: s });
});
export const updateStage = asyncHandler(async (req, res) => {
  const s = await PipelineStage.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!s) throw ApiError.notFound();
  res.json({ stage: s });
});
export const deleteStage = asyncHandler(async (req, res) => {
  await PipelineStage.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});
export const reorderStagesSchema = z.object({
  order: z.array(z.object({ id: z.string(), order: z.number().int().nonnegative() })),
});
export const reorderStages = asyncHandler(async (req, res) => {
  await Promise.all(req.body.order.map((o) => PipelineStage.updateOne({ _id: o.id }, { order: o.order })));
  const items = await PipelineStage.find().sort({ order: 1 }).lean();
  res.json({ items });
});

export const sourceSchema = z.object({ name: z.string().min(2), isActive: z.boolean().optional() });

export const listSources = asyncHandler(async (_req, res) => {
  const items = await LeadSource.find().sort({ name: 1 }).lean();
  res.json({ items });
});
export const createSource = asyncHandler(async (req, res) => {
  const s = await LeadSource.create(req.body);
  res.status(201).json({ source: s });
});
export const updateSource = asyncHandler(async (req, res) => {
  const s = await LeadSource.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!s) throw ApiError.notFound();
  res.json({ source: s });
});
export const deleteSource = asyncHandler(async (req, res) => {
  await LeadSource.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});
