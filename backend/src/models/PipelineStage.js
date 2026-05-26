import mongoose from 'mongoose';

const pipelineStageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    order: { type: Number, required: true, index: true },
    probability: { type: Number, min: 0, max: 100, default: 0 },
    color: { type: String, default: '#5B9DF9' },
    isTerminal: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const PipelineStage =
  mongoose.models.PipelineStage || mongoose.model('PipelineStage', pipelineStageSchema);
