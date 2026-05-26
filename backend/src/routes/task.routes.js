import { Router } from 'express';
import {
  myDay,
  listTasks,
  createTask,
  updateTask,
  completeTask,
  snoozeTask,
  createTaskSchema,
  snoozeSchema,
} from '../controllers/taskController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const r = Router();
r.use(requireAuth);
r.get('/my-day', myDay);
r.get('/', listTasks);
r.post('/', validate(createTaskSchema), createTask);
r.patch('/:id', updateTask);
r.post('/:id/complete', completeTask);
r.post('/:id/snooze', validate(snoozeSchema), snoozeTask);
export default r;
