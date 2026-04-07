import mongoose from 'mongoose';

const GenerationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    generationType: {
      type: String,
      enum: ['poster', 'logo'],
      required: true,
    },
    jobId: {
      type: String,
      required: true,
      index: true,
    },
    taskIds: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    creditCost: {
      type: Number,
      default: 1,
    },
    creditDeducted: {
      type: Boolean,
      default: false,
    },
    inputData: {
      type: Object,
      default: {},
    },
    resultUrls: {
      type: [String], // Array to store multiple variant URLs
      default: [],
    },
    apiResponse: {
      type: Object,
      default: {},
    },
    error: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Generation = mongoose.models.Generation || mongoose.model('Generation', GenerationSchema);

export default Generation;
