import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  source: {
    type: String,
    required: true
  },
  author: {
    type: String,
    default: ''
  },
  publishedAt: {
    type: Date,
    required: true
  },
  urlToImage: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'general'
  },
  // Vector embedding for similarity search
  embedding: {
    type: [Number],
    default: []
  },
  // Misinformation analysis results
  misinformationAnalysis: {
    misinformation_score: { type: Number, default: 0 },
    bias_score: { type: Number, default: 0 },
    credibility_indicators: {
      sensational_language: { type: Number, default: 0 },
      lack_of_sources: { type: Number, default: 0 },
      emotional_manipulation: { type: Number, default: 0 },
      factual_inconsistencies: { type: Number, default: 0 },
      logical_fallacies: { type: Number, default: 0 }
    },
    positive_indicators: {
      credible_sources_cited: { type: Number, default: 0 },
      balanced_reporting: { type: Number, default: 0 },
      factual_accuracy: { type: Number, default: 0 },
      professional_tone: { type: Number, default: 0 }
    },
    summary: { type: String, default: '' },
    red_flags: [String],
    strengths: [String],
    analyzed_at: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// Create indexes for better performance
articleSchema.index({ publishedAt: -1 });
articleSchema.index({ source: 1 });
articleSchema.index({ category: 1 });
articleSchema.index({ url: 1 });
articleSchema.index({ 'misinformationAnalysis.misinformation_score': -1 });

const Article = mongoose.model('Article', articleSchema);

export default Article;
