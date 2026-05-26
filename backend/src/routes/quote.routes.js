import { Router } from 'express';
import {
  listQuotes,
  getQuote,
  createQuote,
  updateQuote,
  sendQuote,
  pdfQuote,
  createQuoteSchema,
} from '../controllers/quoteController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const r = Router();
r.use(requireAuth);
r.get('/', listQuotes);
r.post('/', validate(createQuoteSchema), createQuote);
r.get('/:id', getQuote);
r.patch('/:id', updateQuote);
r.post('/:id/send', sendQuote);
r.get('/:id/pdf', pdfQuote);
export default r;
