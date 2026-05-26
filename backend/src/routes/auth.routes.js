import { Router } from 'express';
import { login, me, logout, loginSchema } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();
r.post('/login', validate(loginSchema), login);
r.post('/logout', requireAuth, logout);
r.get('/me', requireAuth, me);
export default r;
