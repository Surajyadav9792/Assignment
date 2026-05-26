import mongoose from 'mongoose';

const sampleSchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    quantity: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['requested', 'dispatched', 'delivered', 'feedback_received', 'approved', 'rejected'],
      default: 'requested',
      index: true,
    },
    courier: String,
    awbNumber: String,
    dispatchedAt: Date,
    deliveredAt: Date,
    expectedFeedbackDate: Date,
    feedbackNotes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Sample = mongoose.models.Sample || mongoose.model('Sample', sampleSchema);
