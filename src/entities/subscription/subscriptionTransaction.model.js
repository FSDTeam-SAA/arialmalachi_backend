import mongoose from 'mongoose';

const SubscriptionTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'usd',
    },
  },
  { timestamps: true }
);

const SubscriptionTransaction = mongoose.models.SubscriptionTransaction || mongoose.model('SubscriptionTransaction', SubscriptionTransactionSchema);

export default SubscriptionTransaction;
