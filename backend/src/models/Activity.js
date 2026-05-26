import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'note', 'sample', 'quote', 'rfq', 'stage_change'],
      required: true,
      index: true,
    },
    subject: String,
    body: String,
    outcome: String,
    occurredAt: { type: Date, required: true, default: Date.now, index: true },
    nextFollowUp: Date,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
