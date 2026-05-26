import { Router } from 'express';
import { list, markRead, markAllRead } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();
r.use(requireAuth);
r.get('/', list);
r.post('/:id/read', markRead);
r.post('/read-all', markAllRead);
export default r;
