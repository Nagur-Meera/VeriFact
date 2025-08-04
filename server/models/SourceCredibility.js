import mongoose from 'mongoose';

const sourceCredibilitySchema = new mongoose.Schema({
  source_name: {
    type: String,
    required: true,
    unique: true
  },
  overall_credibility: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  factors: {
    editorial_standards: { type: Number, min: 0, max: 100, default: 50 },
    fact_checking_history: { type: Number, min: 0, max: 100, default: 50 },
    source_transparency: { type: Number, min: 0, max: 100, default: 50 },
    bias_level: { type: Number, min: 0, max: 100, default: 50 },
    accuracy_track_record: { type: Number, min: 0, max: 100, default: 50 }
  },
  reputation: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Unreliable'],
    default: 'Fair'
  },
  bias_direction: {
    type: String,
    enum: ['Left', 'Center-Left', 'Center', 'Center-Right', 'Right', 'Mixed'],
    default: 'Mixed'
  },
  strengths: [String],
  concerns: [String],
  recommendation: String,
  // Analysis history
  articles_analyzed: {
    type: Number,
    default: 0
  },
  last_analysis: {
    type: Date,
    default: Date.now
  },
  analysis_count: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Create indexes
sourceCredibilitySchema.index({ source_name: 1 });
sourceCredibilitySchema.index({ overall_credibility: -1 });
sourceCredibilitySchema.index({ reputation: 1 });
sourceCredibilitySchema.index({ last_analysis: -1 });

const SourceCredibility = mongoose.model('SourceCredibility', sourceCredibilitySchema);

export default SourceCredibility;
