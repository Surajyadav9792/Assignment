import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';

export const notFound = (req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found`, code: 'NOT_FOUND' });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, code: err.code, details: err.details });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message, code: 'VALIDATION_ERROR', details: err.errors });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id', code: 'BAD_REQUEST' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate value', code: 'CONFLICT', details: err.keyValue });
  }
  logger.error(`${err.stack || err.message}`);
  res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
};
