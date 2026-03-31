import mongoose from 'mongoose';

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    monthlyPrice: {
      type: Number,
      required: [true, 'Monthly price is required'],
      min: [0, 'Price cannot be negative'],
    },
    description: {
      type: String,
      trim: true,
    },
    credits: {
      type: Number,
      default: 0,
      min: [0, 'Credits cannot be negative'],
    },
    features: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const SubscriptionPlan = mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);

export default SubscriptionPlan;
