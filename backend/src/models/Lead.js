import mongoose from 'mongoose';

const stageHistorySchema = new mongoose.Schema(
  {
    stage: { type: mongoose.Schema.Types.ObjectId, ref: 'PipelineStage' },
    enteredAt: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const leadSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, index: true, trim: true },
    contactName: { type: String, required: true, trim: true },
    designation: String,
    email: { type: String, lowercase: true, trim: true, index: true },
    phone: { type: String, index: true },
    location: {
      city: String,
      state: String,
      country: { type: String, default: 'India' },
    },
    industryVertical: { type: String, index: true },
    source: { type: mongoose.Schema.Types.ObjectId, ref: 'LeadSource' },
    productInterest: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    estimatedValue: { type: Number, default: 0 },
    expectedCloseDate: Date,
    stage: { type: mongoose.Schema.Types.ObjectId, ref: 'PipelineStage', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    score: { type: Number, default: 0, min: 0, max: 100 },
    temperature: { type: String, enum: ['hot', 'warm', 'cold'], default: 'cold' },
    stageHistory: { type: [stageHistorySchema], default: [] },
    lastActivityAt: Date,
    notes: String,
    tags: [String],
    isArchived: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ['active', 'won', 'lost', 'onhold'], default: 'active', index: true },
  },
  { timestamps: true }
);

leadSchema.index({ companyName: 'text', contactName: 'text', email: 'text', phone: 'text' });

export const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);
