import { Router } from 'express';
import multer from 'multer';
import {
  listLeads,
  getLead,
  createLead,
  updateLead,
  moveStage,
  assignLead,
  archiveLead,
  bulkImport,
  createLeadSchema,
  moveStageSchema,
  assignSchema,
} from '../controllers/leadController.js';
import { listActivities, createActivity, createActivitySchema } from '../controllers/activityController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const r = Router();
r.use(requireAuth);

r.get('/', listLeads);
r.post('/', validate(createLeadSchema), createLead);
r.post('/bulk-import', requireRole('admin', 'manager'), upload.single('file'), bulkImport);

r.get('/:id', getLead);
r.patch('/:id', updateLead);
r.patch('/:id/stage', validate(moveStageSchema), moveStage);
r.patch('/:id/assign', requireRole('admin', 'manager'), validate(assignSchema), assignLead);
r.delete('/:id', requireRole('admin', 'manager'), archiveLead);

r.get('/:leadId/activities', listActivities);
r.post('/:leadId/activities', validate(createActivitySchema), createActivity);

export default r;
