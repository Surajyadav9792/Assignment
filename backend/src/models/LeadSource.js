import mongoose from 'mongoose';

const leadSourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const LeadSource =
  mongoose.models.LeadSource || mongoose.model('LeadSource', leadSourceSchema);
