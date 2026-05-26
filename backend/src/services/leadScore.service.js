import { Lead } from '../models/Lead.js';
import { Activity } from '../models/Activity.js';
import { LeadSource } from '../models/LeadSource.js';

const SOURCE_QUALITY = {
  Referral: 100,
  'Trade Show': 80,
  'Existing Customer': 90,
  Website: 60,
  LinkedIn: 60,
  IndiaMART: 40,
  'Cold Outreach': 20,
};

const MAX_VALUE_FOR_NORM = 5_000_000;

export async function recomputeScore(leadId) {
  const lead = await Lead.findById(leadId).populate('source').lean();
  if (!lead) return null;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activityCount = await Activity.countDocuments({
    lead: leadId,
    occurredAt: { $gte: thirtyDaysAgo },
  });

  const normalizedValue = Math.min((lead.estimatedValue || 0) / MAX_VALUE_FOR_NORM, 1) * 100;
  const engagementScore = Math.min(activityCount / 10, 1) * 100;

  let recencyScore = 0;
  if (lead.lastActivityAt) {
    const days = (Date.now() - new Date(lead.lastActivityAt).getTime()) / (24 * 60 * 60 * 1000);
    if (days < 3) recencyScore = 100;
    else if (days < 14) recencyScore = 50;
  }

  const sourceName = lead.source?.name || '';
  const sourceQuality = SOURCE_QUALITY[sourceName] ?? 30;

  const score = Math.round(
    0.4 * normalizedValue + 0.3 * engagementScore + 0.2 * recencyScore + 0.1 * sourceQuality
  );
  const temperature = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';

  await Lead.updateOne({ _id: leadId }, { $set: { score, temperature } });
  return { score, temperature };
}
