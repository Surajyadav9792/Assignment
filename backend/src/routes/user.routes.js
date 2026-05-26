import { Router } from 'express';
import {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
  createUserSchema,
  updateUserSchema,
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const r = Router();
r.use(requireAuth);
r.get('/', requireRole('admin', 'manager'), listUsers);
r.post('/', requireRole('admin'), validate(createUserSchema), createUser);
r.patch('/:id', requireRole('admin'), validate(updateUserSchema), updateUser);
r.delete('/:id', requireRole('admin'), deactivateUser);
export default r;
