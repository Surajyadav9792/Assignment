import { Router } from 'express';
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  productSchema,
  listStages,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
  reorderStagesSchema,
  stageSchema,
  listSources,
  createSource,
  updateSource,
  deleteSource,
  sourceSchema,
} from '../controllers/settingsController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const r = Router();
r.use(requireAuth);

// Products
r.get('/products', listProducts);
r.post('/products', requireRole('admin'), validate(productSchema), createProduct);
r.patch('/products/:id', requireRole('admin'), updateProduct);
r.delete('/products/:id', requireRole('admin'), deleteProduct);

// Stages
r.get('/stages', listStages);
r.post('/stages', requireRole('admin'), validate(stageSchema), createStage);
r.patch('/stages/reorder', requireRole('admin'), validate(reorderStagesSchema), reorderStages);
r.patch('/stages/:id', requireRole('admin'), updateStage);
r.delete('/stages/:id', requireRole('admin'), deleteStage);

// Sources
r.get('/sources', listSources);
r.post('/sources', requireRole('admin'), validate(sourceSchema), createSource);
r.patch('/sources/:id', requireRole('admin'), updateSource);
r.delete('/sources/:id', requireRole('admin'), deleteSource);

export default r;
