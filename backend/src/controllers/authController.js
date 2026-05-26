import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { signToken } from '../utils/jwt.js';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.isActive) throw ApiError.unauthorized('Invalid credentials');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Invalid credentials');

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ uid: user._id.toString(), role: user.role });
  res.json({ token, user: user.toSafeJSON() });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).lean();
  if (!user) throw ApiError.unauthorized();
  delete user.passwordHash;
  res.json({ user });
});

export const logout = asyncHandler(async (_req, res) => {
  res.json({ ok: true });
});
