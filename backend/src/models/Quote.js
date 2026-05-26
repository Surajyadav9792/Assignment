import mongoose from 'mongoose';

const quoteItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    sku: String,
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    discountPct: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const quoteSchema = new mongoose.Schema(
  {
    quoteNumber: { type: String, unique: true, index: true },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    items: { type: [quoteItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    taxPct: { type: Number, default: 18 },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'rejected', 'revised'],
      default: 'draft',
      index: true,
    },
    validUntil: Date,
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sentAt: Date,
  },
  { timestamps: true }
);

export const Quote = mongoose.models.Quote || mongoose.model('Quote', quoteSchema);
