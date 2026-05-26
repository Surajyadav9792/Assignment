import { Router } from 'express';
import {
  funnel,
  leaderboard,
  scorecard,
  heatmap,
  forecast,
  stuckDeals,
  managerKPIs,
  activityFeed,
} from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const r = Router();
r.use(requireAuth);
r.get('/funnel', requireRole('admin', 'manager'), funnel);
r.get('/leaderboard', requireRole('admin', 'manager'), leaderboard);
r.get('/forecast', requireRole('admin', 'manager'), forecast);
r.get('/stuck-deals', requireRole('admin', 'manager'), stuckDeals);
r.get('/kpis', requireRole('admin', 'manager'), managerKPIs);
r.get('/activity-feed', requireRole('admin', 'manager'), activityFeed);
r.get('/scorecard/:userId', scorecard);
r.get('/heatmap/:userId', heatmap);
export default r;
