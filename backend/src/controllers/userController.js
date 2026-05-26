import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'manager', 'bda']),
  managerId: z.string().optional().nullable(),
  phone: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'manager', 'bda']).optional(),
  managerId: z.string().nullable().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const listUsers = asyncHandler(async (req, res) => {
  const q = {};
  if (req.user.role === 'manager') {
    q.$or = [{ managerId: req.user._id }, { _id: req.user._id }];
  }
  const users = await User.find(q).sort({ createdAt: -1 }).lean();
  users.forEach((u) => delete u.passwordHash);
  res.json({ users });
});

export const createUser = asyncHandler(async (req, res) => {
  const { password, ...rest } = req.body;
  const exists = await User.findOne({ email: rest.email.toLowerCase() });
  if (exists) throw ApiError.conflict('Email already exists');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ ...rest, passwordHash });
  res.status(201).json({ user: user.toSafeJSON() });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!user) throw ApiError.notFound();
  res.json({ user: user.toSafeJSON() });
});

export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) throw ApiError.notFound();
  res.json({ user: user.toSafeJSON() });
});
