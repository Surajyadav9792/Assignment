import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/apiError.js';
import { User } from '../models/User.js';

export const requireAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized('Missing token');
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.uid).lean();
    if (!user || !user.isActive) throw ApiError.unauthorized('Invalid session');
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')
      return next(ApiError.unauthorized('Token expired or invalid'));
    next(err);
  }
};
