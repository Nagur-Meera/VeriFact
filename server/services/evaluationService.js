import FactCheck from '../models/FactCheck.js';
import Article from '../models/Article.js';

class EvaluationService {
  constructor() {
    this.metrics = {
      retrieval_accuracy: [],
      response_faithfulness: [],
      answer_relevancy: [],
      context_precision: [],
      context_recall: []
    };
  }

  // RAGAS-inspired evaluation metrics
  async calculateRAGASMetrics(claims = null, responses = null, groundTruth = null) {
    try {
      // If no parameters provided, get data from database
      if (!claims || !responses) {
        const factChecks = await FactCheck.find().limit(100).sort({ createdAt: -1 });
        
        if (!factChecks || factChecks.length === 0) {
          return this.getDefaultMetrics();
        }

        claims = factChecks.map(fc => fc.claim).filter(Boolean);
        responses = factChecks.map(fc => fc.explanation || fc.verdict).filter(Boolean);
      }

      // Ensure we have data to work with
      if (!claims || !responses || claims.length === 0 || responses.length === 0) {
        return this.getDefaultMetrics();
      }

      const results = {
        faithfulness: await this.calculateFaithfulness(claims, responses),
        answer_relevancy: await this.calculateAnswerRelevancy(claims, responses),
        context_precision: await this.calculateContextPrecision(responses),
        context_recall: groundTruth ? await this.calculateContextRecall(responses, groundTruth) : 0.8, // Default value
        overall_score: 0
      };

      // Calculate overall score (weighted average)
      const weights = { faithfulness: 0.3, answer_relevancy: 0.3, context_precision: 0.25, context_recall: 0.15 };
      results.overall_score = (
        results.faithfulness * weights.faithfulness +
        results.answer_relevancy * weights.answer_relevancy +
        results.context_precision * weights.context_precision +
        results.context_recall * weights.context_recall
      );

      return results;
    } catch (error) {
      console.error('Error in calculateRAGASMetrics:', error);
      return this.getDefaultMetrics();
    }
  }

  getDefaultMetrics() {
    return {
      faithfulness: 0,
      answer_relevancy: 0,
      context_precision: 0,
      context_recall: 0,
      overall_score: 0,
      message: 'No data available for evaluation'
    };
  }

  async calculateFaithfulness(claims, responses) {
    if (!claims || !responses || claims.length === 0 || responses.length === 0) {
      return 0;
    }

    let totalScore = 0;
    let count = 0;

    for (let i = 0; i < claims.length && i < responses.length; i++) {
      const claim = claims[i];
      const response = responses[i];
      
      if (claim && response) {
        // Check if response is supported by evidence
        const faithfulnessScore = this.assessResponseFaithfulness(claim, response);
        totalScore += faithfulnessScore;
        count++;
      }
    }

    return count > 0 ? totalScore / count : 0;
  }

  assessResponseFaithfulness(claim, response) {
    const evidence = response.factCheck?.evidence || '';
    const sources = response.sources || [];
    
    // Basic faithfulness assessment
    let score = 0;
    
    // Check if verdict is supported by evidence
    if (evidence.length > 50) score += 0.3;
    
    // Check if sources are provided
    if (sources.length > 0) score += 0.3;
    
    // Check confidence alignment
    const confidence = response.factCheck?.confidence || 0;
    if (confidence > 60 && sources.length >= 2) score += 0.4;
    else if (confidence <= 60 && sources.length >= 1) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  async calculateAnswerRelevancy(claims, responses) {
    let totalScore = 0;
    let count = 0;

    for (let i = 0; i < claims.length && i < responses.length; i++) {
      const claim = claims[i];
      const response = responses[i];
      
      // Assess how relevant the response is to the claim
      const relevancyScore = this.assessAnswerRelevancy(claim, response);
      totalScore += relevancyScore;
      count++;
    }

    return count > 0 ? totalScore / count : 0;
  }

  assessAnswerRelevancy(claim, response) {
    const explanation = response.factCheck?.explanation || '';
    const keyPoints = response.factCheck?.key_points || [];
    
    // Basic relevancy assessment using keyword overlap
    const claimWords = claim.toLowerCase().split(/\s+/);
    const responseWords = explanation.toLowerCase().split(/\s+/);
    
    const overlap = claimWords.filter(word => 
      responseWords.includes(word) && word.length > 3
    ).length;
    
    let score = Math.min(overlap / Math.max(claimWords.length * 0.3, 1), 0.6);
    
    // Bonus for structured response
    if (keyPoints.length > 0) score += 0.2;
    if (explanation.length > 100) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  async calculateContextPrecision(responses) {
    let totalScore = 0;
    let count = 0;

    for (const response of responses) {
      const sources = response.sources || [];
      const precisionScore = this.assessContextPrecision(sources);
      totalScore += precisionScore;
      count++;
    }

    return count > 0 ? totalScore / count : 0;
  }

  assessContextPrecision(sources) {
    if (sources.length === 0) return 0;
    
    let relevantSources = 0;
    for (const source of sources) {
      // Consider source relevant if relevance score > 0.5
      if (source.score && source.score > 0.5) {
        relevantSources++;
      }
    }
    
    return relevantSources / sources.length;
  }

  async calculateContextRecall(responses, groundTruth) {
    // This would require ground truth data
    // For now, return estimated recall based on source coverage
    let totalRecall = 0;
    let count = 0;

    for (const response of responses) {
      const sources = response.sources || [];
      // Estimate recall based on number and quality of sources
      const recall = Math.min(sources.length / 3, 1.0); // Assume 3 sources is good recall
      totalRecall += recall;
      count++;
    }

    return count > 0 ? totalRecall / count : 0;
  }

  // Retrieval accuracy metrics
  async calculateRetrievalAccuracy(queries, retrievedDocs, relevantDocs) {
    const metrics = {
      precision_at_k: {},
      recall_at_k: {},
      map: 0,
      mrr: 0
    };

    const kValues = [1, 3, 5, 10];
    
    for (const k of kValues) {
      metrics.precision_at_k[k] = this.calculatePrecisionAtK(retrievedDocs, relevantDocs, k);
      metrics.recall_at_k[k] = this.calculateRecallAtK(retrievedDocs, relevantDocs, k);
    }

    metrics.map = this.calculateMAP(retrievedDocs, relevantDocs);
    metrics.mrr = this.calculateMRR(retrievedDocs, relevantDocs);

    return metrics;
  }

  calculatePrecisionAtK(retrieved, relevant, k) {
    if (!retrieved || retrieved.length === 0) return 0;
    
    const topK = retrieved.slice(0, k);
    const relevantInTopK = topK.filter(doc => 
      relevant.some(rel => rel.id === doc.id)
    ).length;
    
    return relevantInTopK / Math.min(k, topK.length);
  }

  calculateRecallAtK(retrieved, relevant, k) {
    if (!relevant || relevant.length === 0) return 0;
    
    const topK = retrieved.slice(0, k);
    const relevantInTopK = topK.filter(doc => 
      relevant.some(rel => rel.id === doc.id)
    ).length;
    
    return relevantInTopK / relevant.length;
  }

  calculateMAP(retrieved, relevant) {
    if (!relevant || relevant.length === 0) return 0;
    
    let sum = 0;
    let relevantFound = 0;
    
    for (let i = 0; i < retrieved.length; i++) {
      const doc = retrieved[i];
      if (relevant.some(rel => rel.id === doc.id)) {
        relevantFound++;
        sum += relevantFound / (i + 1);
      }
    }
    
    return sum / relevant.length;
  }

  calculateMRR(retrieved, relevant) {
    for (let i = 0; i < retrieved.length; i++) {
      const doc = retrieved[i];
      if (relevant.some(rel => rel.id === doc.id)) {
        return 1 / (i + 1);
      }
    }
    return 0;
  }

  // System performance metrics
  async calculateSystemMetrics() {
    try {
      const totalFactChecks = await FactCheck.countDocuments();
      const recentFactChecks = await FactCheck.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      const avgConfidence = await FactCheck.aggregate([
        { $group: { _id: null, avgConfidence: { $avg: '$confidence' } } }
      ]);
      
      const verdictDistribution = await FactCheck.aggregate([
        { $group: { _id: '$verdict', count: { $sum: 1 } } }
      ]);

      return {
        total_fact_checks: totalFactChecks,
        daily_fact_checks: recentFactChecks,
        average_confidence: avgConfidence[0]?.avgConfidence || 0,
        verdict_distribution: verdictDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('System metrics calculation error:', error);
      return {
        total_fact_checks: 0,
        daily_fact_checks: 0,
        average_confidence: 0,
        verdict_distribution: {},
        error: error.message
      };
    }
  }

  // Latency and performance tracking
  trackResponseTime(startTime, endTime, operation) {
    const latency = endTime - startTime;
    
    if (!this.performanceMetrics) {
      this.performanceMetrics = {};
    }
    
    if (!this.performanceMetrics[operation]) {
      this.performanceMetrics[operation] = [];
    }
    
    this.performanceMetrics[operation].push(latency);
    
    // Keep only last 100 measurements
    if (this.performanceMetrics[operation].length > 100) {
      this.performanceMetrics[operation] = this.performanceMetrics[operation].slice(-100);
    }
    
    return latency;
  }

  getPerformanceStats(operation) {
    const metrics = this.performanceMetrics?.[operation] || [];
    if (metrics.length === 0) return null;
    
    const sorted = [...metrics].sort((a, b) => a - b);
    
    return {
      count: metrics.length,
      avg: metrics.reduce((a, b) => a + b, 0) / metrics.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
}

export default EvaluationService;
