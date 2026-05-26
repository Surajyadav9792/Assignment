import { Router } from 'express';
import {
  listSamples,
  createSample,
  updateSample,
  createSampleSchema,
} from '../controllers/sampleController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const r = Router();
r.use(requireAuth);
r.get('/', listSamples);
r.post('/', validate(createSampleSchema), createSample);
r.patch('/:id', updateSample);
export default r;
