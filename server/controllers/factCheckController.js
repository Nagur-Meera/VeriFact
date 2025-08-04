import GeminiClient from '../services/geminiClient.js';
import VectorService from '../services/vectorService.js';
import NewsService from '../services/newsService.js';
import RedisService from '../services/redisService.js';
import EvaluationService from '../services/evaluationService.js';
import FactCheck from '../models/FactCheck.js';
import Article from '../models/Article.js';
import SourceCredibility from '../models/SourceCredibility.js';

class FactCheckController {
  constructor(io) {
    this.geminiClient = new GeminiClient();
    this.vectorService = new VectorService();
    this.newsService = new NewsService();
    this.redisService = new RedisService();
    this.evaluationService = new EvaluationService();
    this.io = io;
  }

  async initialize() {
    try {
      console.log('Initializing Fact Check Controller...');
      
      await this.vectorService.initialize();
      
      // Attempt Redis connection with timeout
      let redisEnabled = false;
      try {
        console.log('Attempting to connect to Redis...');
        const connectPromise = this.redisService.connect();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis connection timeout')), 8000)
        );
        
        redisEnabled = await Promise.race([connectPromise, timeoutPromise]);
        
        if (redisEnabled) {
          console.log('✅ Redis connected successfully - caching enabled');
        } else {
          console.log('⚠️ Redis connection failed - using in-memory fallbacks');
        }
      } catch (redisError) {
        console.warn('⚠️ Redis connection failed, continuing without caching:', redisError.message);
        this.redisService.isConnected = false;
        if (this.redisService.client) {
          try {
            await this.redisService.client.disconnect();
          } catch (disconnectError) {
            // Ignore disconnect errors
          }
        }
        redisEnabled = false;
      }
      
      // Log final Redis status
      const status = redisEnabled ? 'ENABLED (caching active)' : 'DISABLED (using in-memory fallbacks for stability)';
      console.log(`Redis Status: ${status}`);
    } catch (error) {
      console.error('Failed to initialize Fact Check Controller:', error);
      throw error;
    }
  }

  async factCheckClaim(req, res) {
    try {
      const { claim } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress;

      if (!claim || claim.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Claim is required'
        });
      }

      // Check rate limiting (with fallback)
      try {
        const allowed = await this.redisService.checkRateLimit(clientIP, 50, 3600000);
        if (!allowed) {
          return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded. Please try again later.'
          });
        }
      } catch (redisError) {
        console.warn('Rate limiting check failed, proceeding without limit:', redisError.message);
      }

      // Increment fact-check counter (with fallback)
      try {
        await this.redisService.incrementStat('factchecks_performed');
        await this.redisService.incrementDailyCounter('factchecks');
      } catch (redisError) {
        console.warn('Stats increment failed:', redisError.message);
      }

      // Check cache first (with fallback)
      let cachedResult = null;
      try {
        cachedResult = await this.redisService.getCachedFactCheck(claim);
      } catch (redisError) {
        console.warn('Cache check failed:', redisError.message);
      }
      
      if (cachedResult) {
        return res.json({
          ...cachedResult,
          cached: true,
          timestamp: new Date().toISOString()
        });
      }

      // Search for similar articles and fact-checks
      const searchResults = await this.vectorService.factCheckClaim(claim);

      // Format context from similar articles
      const context = searchResults.similarArticles
        .map(result => 
          `Source: ${result.article.source}\n` +
          `Title: ${result.article.title}\n` +
          `Content: ${result.article.content || result.article.description}\n` +
          `Published: ${result.article.publishedAt}\n` +
          `Relevance Score: ${result.score.toFixed(3)}`
        )
        .join('\n\n---\n\n');

      const sources = searchResults.similarArticles.map(result => ({
        source: result.article.source,
        title: result.article.title,
        url: result.article.url,
        score: result.score,
        publishedAt: result.article.publishedAt
      }));

      // Add previous fact-checks to context
      const previousFactChecks = searchResults.similarFactChecks
        .map(result => 
          `Previous Fact-Check:\n` +
          `Claim: ${result.article.claim}\n` +
          `Verdict: ${result.article.verdict}\n` +
          `Evidence: ${result.article.evidence}`
        )
        .join('\n\n');

      const fullContext = context + (previousFactChecks ? '\n\n=== PREVIOUS FACT-CHECKS ===\n\n' + previousFactChecks : '');

      // Generate fact-check response using Gemini
      const factCheckResult = await this.geminiClient.generateFactCheckResponse(
        claim,
        fullContext,
        sources
      );

      // Store fact-check in vector database
      try {
        await this.vectorService.upsertFactCheck(claim, factCheckResult, searchResults.embedding);
      } catch (error) {
        console.error('Failed to store fact-check:', error);
      }

      const result = {
        success: true,
        claim,
        factCheck: factCheckResult,
        sources,
        previousFactChecks: searchResults.similarFactChecks,
        cached: false,
        timestamp: new Date().toISOString()
      };

      // Save to MongoDB
      try {
        const factCheckDoc = new FactCheck({
          claim,
          verdict: factCheckResult.verdict,
          confidence: factCheckResult.confidence,
          evidence: factCheckResult.evidence,
          explanation: factCheckResult.explanation,
          sources_used: factCheckResult.sources_used || [],
          key_points: factCheckResult.key_points || [],
          credibility_score: factCheckResult.credibility_score || 50,
          sourceArticles: sources.map(s => ({
            article_id: s.url,
            relevance_score: s.score,
            title: s.title,
            url: s.url,
            source: s.source
          })),
          embedding: searchResults.embedding || [],
          requestIP: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          cached: false
        });
        
        await factCheckDoc.save();
        console.log('Fact-check saved to database');
      } catch (dbError) {
        console.error('Failed to save fact-check to database:', dbError.message);
      }

      // Cache the result (with fallback)
      try {
        await this.redisService.cacheFactCheck(claim, result, 7200); // Cache for 2 hours
      } catch (redisError) {
        console.warn('Caching failed:', redisError.message);
      }

      // Publish real-time update
      this.io.emit('factcheck_result', {
        claim: claim.substring(0, 100) + (claim.length > 100 ? '...' : ''),
        verdict: factCheckResult.verdict,
        confidence: factCheckResult.confidence,
        timestamp: new Date().toISOString()
      });

      res.json(result);

    } catch (error) {
      console.error('Fact-check error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async analyzeArticle(req, res) {
    try {
      const { articleText, url, title } = req.body;

      if (!articleText || articleText.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Article text is required'
        });
      }

      await this.redisService.incrementStat('articles_analyzed');
      await this.redisService.incrementDailyCounter('articles');

      // Detect misinformation
      const misinformationAnalysis = await this.geminiClient.detectMisinformation(articleText);

      // Generate embedding and potentially store
      const embedding = await this.vectorService.generateEmbedding(articleText);

      // If high misinformation score, publish alert
      if (misinformationAnalysis.misinformation_score > 70) {
        this.io.emit('misinformation_alert', {
          title: title || 'Unknown Title',
          url: url || 'Unknown URL',
          score: misinformationAnalysis.misinformation_score,
          summary: misinformationAnalysis.summary,
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({
        success: true,
        analysis: misinformationAnalysis,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Article analysis error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getLatestNews(req, res) {
    try {
      const { query, category = 'general' } = req.query;
      
      // Check cache first
      const cacheKey = query || category;
      const cachedNews = await this.redisService.getCachedNews(cacheKey);
      
      if (cachedNews) {
        return res.json({
          success: true,
          articles: cachedNews,
          count: cachedNews.length,
          cached: true
        });
      }

      let articles;
      if (query) {
        articles = await this.newsService.fetchLatestNews(query);
      } else {
        articles = await this.newsService.fetchTopHeadlines('us', category);
      }

      // Filter out articles with null content
      articles = articles.filter(article => 
        article.title && 
        article.title !== '[Removed]' &&
        article.description &&
        article.content
      );

      // Cache the news
      await this.redisService.cacheNews(cacheKey, articles, 300); // Cache for 5 minutes

      // Process articles in background
      this.processArticlesBackground(articles.slice(0, 10)); // Process top 10

      res.json({
        success: true,
        articles,
        count: articles.length,
        cached: false
      });

    } catch (error) {
      console.error('News fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getTrendingTopics(req, res) {
    try {
      const trending = await this.newsService.getTrendingTopics();
      
      res.json({
        success: true,
        trending,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Trending topics error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getSystemStats(req, res) {
    try {
      const redisStats = await this.redisService.getStats();
      const vectorStats = await this.vectorService.getIndexStats();
      
      const stats = {
        redis_connected: this.redisService.isConnected,
        vector_stats: vectorStats,
        usage_stats: redisStats,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      };

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getDailyActivity(req, res) {
    try {
      const dailyStats = await this.redisService.getDailyActivity();
      
      res.json({
        success: true,
        activity: dailyStats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Daily activity error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async processArticlesBackground(articles) {
    // Process articles for misinformation in background
    for (const article of articles) {
      try {
        if (article.content && article.content.length > 100 && article.title !== '[Removed]') {
          // Generate embedding and store
          const text = `${article.title} ${article.description} ${article.content}`;
          const embedding = await this.vectorService.generateEmbedding(text);
          
          await this.vectorService.upsertArticle(article, embedding);

          // Analyze for misinformation (rate limited)
          if (Math.random() < 0.3) { // Only analyze 30% to avoid rate limits
            try {
              const analysis = await this.geminiClient.detectMisinformation(article.content);
              
              // If high misinformation score, publish alert
              if (analysis.misinformation_score > 75) {
                this.io.emit('misinformation_alert', {
                  title: article.title,
                  source: article.source,
                  score: analysis.misinformation_score,
                  url: article.url,
                  summary: analysis.summary,
                  timestamp: new Date().toISOString()
                });
              }
            } catch (analysisError) {
              console.error('Background analysis error:', analysisError);
            }
          }
        }
      } catch (error) {
        console.error('Background processing error:', error);
      }
    }
  }

  // Get RAG system evaluation metrics
  async getEvaluationMetrics(req, res) {
    try {
      console.log('Calculating RAG evaluation metrics...');
      
      const metrics = await this.evaluationService.calculateRAGASMetrics();
      
      res.json({
        success: true,
        metrics: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Evaluation metrics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate evaluation metrics',
        details: error.message
      });
    }
  }
}

export default FactCheckController;
