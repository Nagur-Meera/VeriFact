import mongoose from 'mongoose';

const factCheckSchema = new mongoose.Schema({
  claim: {
    type: String,
    required: true,
    text: true // Enable text search
  },
  verdict: {
    type: String,
    required: true,
    enum: ['True', 'False', 'Partially True', 'Unverified', 'Misleading']
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  evidence: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    required: true
  },
  sources_used: [String],
  key_points: [String],
  credibility_score: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  // References to articles used for fact-checking
  sourceArticles: [{
    article_id: String,
    relevance_score: Number,
    title: String,
    url: String,
    source: String
  }],
  // Vector embedding of the claim for similarity search
  embedding: {
    type: [Number],
    default: []
  },
  // Request metadata
  requestIP: String,
  userAgent: String,
  // Performance metrics
  processing_time_ms: Number,
  api_calls_made: Number,
  cached: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes for better performance
factCheckSchema.index({ claim: 'text' });
factCheckSchema.index({ verdict: 1 });
factCheckSchema.index({ confidence: -1 });
factCheckSchema.index({ credibility_score: -1 });
factCheckSchema.index({ createdAt: -1 });
factCheckSchema.index({ cached: 1 });

// Compound index for similar claims search
factCheckSchema.index({ verdict: 1, confidence: -1 });

const FactCheck = mongoose.model('FactCheck', factCheckSchema);

export default FactCheck;
