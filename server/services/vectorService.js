import { Pinecone } from '@pinecone-database/pinecone';
import natural from 'natural';
import { removeStopwords } from 'stopword';
import OpenAI from 'openai';
import { HfInference } from '@huggingface/inference';
import ChromaService from './chromaService.js';

class VectorService {
  constructor() {
    try {
      // Initialize Pinecone for serverless
      this.pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
      });
    } catch (error) {
      console.error('Pinecone initialization error:', error);
      this.pc = null;
    }
    
    // Initialize OpenAI client
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    }) : null;
    
    // Initialize HuggingFace client
    this.hf = process.env.HUGGINGFACE_API_KEY ? new HfInference(process.env.HUGGINGFACE_API_KEY) : null;
    
    // Initialize Chroma service
    this.chromaService = new ChromaService();
    
    this.indexName = process.env.PINECONE_INDEX_NAME || 'verifact-factcheck-index';
    this.index = null;
    this.pineconeAvailable = !!this.pc;
    this.embeddingModel = process.env.EMBEDDING_MODEL || 'custom'; // 'openai', 'huggingface', 'custom'
    this.vectorDatabase = process.env.VECTOR_DATABASE || 'pinecone'; // 'pinecone', 'chroma', 'memory'
  }

  async initialize() {
    try {
      console.log('Initializing Vector Service...');
      
      // Try to initialize vector database based on configuration
      switch (this.vectorDatabase) {
        case 'chroma':
          try {
            const chromaSuccess = await this.chromaService.initialize();
            if (chromaSuccess) {
              console.log('Vector service initialized with Chroma');
              return;
            }
          } catch (error) {
            console.log('Chroma failed, falling back to Pinecone...', error);
          }
          // Fallthrough to Pinecone
          
        case 'pinecone':
          if (!this.pineconeAvailable) {
            console.warn('Pinecone not available, falling back to in-memory storage');
            this.inMemoryVectors = [];
            return;
          }
          
          // Check if index exists, create if not
          try {
            console.log(`Connecting to Pinecone with index: ${this.indexName}`);
            const indexList = await this.pc.listIndexes();
            console.log('Available Pinecone indexes:', indexList.indexes?.map(idx => idx.name) || []);
            
            const indexExists = indexList.indexes?.some(index => index.name === this.indexName);
            
            if (!indexExists) {
              console.log(`Index '${this.indexName}' not found. Available indexes:`, indexList.indexes?.map(idx => idx.name));
              console.log('Creating Pinecone index...');
              const dimension = 384; // Using 384 dimensions for custom embedding
              
              await this.pc.createIndex({
                name: this.indexName,
                dimension: dimension,
                metric: 'cosine',
                spec: {
                  serverless: {
                    cloud: 'aws',
                    region: 'us-east-1'
                  }
                }
              });
              
              // Wait for index to be ready
              await this.waitForIndexReady();
            } else {
              console.log(`✅ Found existing index: ${this.indexName}`);
            }

            this.index = this.pc.index(this.indexName);
            console.log('✅ Vector service initialized with Pinecone');
          } catch (pineconeError) {
            console.error('Pinecone setup failed, falling back to in-memory storage:', pineconeError);
            this.pineconeAvailable = false;
            this.inMemoryVectors = [];
          }
          break;
          
        default:
          console.log('Using in-memory vector storage');
          this.inMemoryVectors = [];
      }
    } catch (error) {
      console.error('Vector service initialization error:', error);
      this.inMemoryVectors = [];
    }
  }

  async waitForIndexReady() {
    let ready = false;
    while (!ready) {
      try {
        const indexDescription = await this.pc.describeIndex(this.indexName);
        ready = indexDescription.status?.ready;
        if (!ready) {
          console.log('Waiting for index to be ready...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.log('Waiting for index creation...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    console.log('Index is ready!');
  }

  // Simple TF-IDF based embedding generation
  generateSimpleEmbedding(text) {
    try {
      // Clean and tokenize text
      const tokenizer = new natural.WordTokenizer();
      const tokens = tokenizer.tokenize(text.toLowerCase());
      
      // Remove stopwords
      const filteredTokens = removeStopwords(tokens);
      
      // Create a simple vector based on word frequency and position
      const wordFreq = {};
      filteredTokens.forEach((token, index) => {
        if (token.length > 2) { // Only consider words longer than 2 chars
          wordFreq[token] = (wordFreq[token] || 0) + 1 / (index + 1); // Position weighting
        }
      });
      
      // Create a fixed-size vector (384 dimensions)
      const vector = new Array(384).fill(0);
      const words = Object.keys(wordFreq);
      
      // Map words to vector positions using hash
      words.forEach(word => {
        const hash = this.simpleHash(word) % 384;
        vector[hash] += wordFreq[word];
      });
      
      // Normalize vector
      const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      if (magnitude > 0) {
        return vector.map(val => val / magnitude);
      }
      
      return vector;
    } catch (error) {
      console.error('Embedding generation error:', error);
      // Return random vector as fallback
      return Array(384).fill(0).map(() => Math.random() * 0.1 - 0.05);
    }
  }

  async generateEmbedding(text) {
    try {
      switch (this.embeddingModel) {
        case 'openai':
          return await this.generateOpenAIEmbedding(text);
        case 'huggingface':
          return await this.generateHuggingFaceEmbedding(text);
        default:
          return this.generateSimpleEmbedding(text);
      }
    } catch (error) {
      console.error(`Embedding generation error with ${this.embeddingModel}:`, error);
      // Fallback to custom embeddings
      return this.generateSimpleEmbedding(text);
    }
  }

  async generateOpenAIEmbedding(text) {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }
    
    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text.substring(0, 8000), // OpenAI token limit
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('OpenAI embedding error:', error);
      throw error;
    }
  }

  async generateHuggingFaceEmbedding(text) {
    if (!this.hf) {
      throw new Error('HuggingFace client not initialized');
    }
    
    try {
      const response = await this.hf.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: text.substring(0, 512), // Model specific limit
      });
      
      // Ensure we get a flat array
      return Array.isArray(response[0]) ? response[0] : response;
    } catch (error) {
      console.error('HuggingFace embedding error:', error);
      throw error;
    }
  }

  // Advanced chunking strategies
  semanticChunking(text, maxChunkSize = 512, overlapSize = 50) {
    try {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const chunks = [];
      let currentChunk = '';
      let currentSize = 0;

      for (const sentence of sentences) {
        const sentenceSize = sentence.trim().length;
        
        if (currentSize + sentenceSize > maxChunkSize && currentChunk) {
          // Add current chunk
          chunks.push(currentChunk.trim());
          
          // Start new chunk with overlap
          const overlap = this.getOverlapText(currentChunk, overlapSize);
          currentChunk = overlap + ' ' + sentence.trim();
          currentSize = overlap.length + sentenceSize;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence.trim();
          currentSize += sentenceSize;
        }
      }
      
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      
      return chunks.length > 0 ? chunks : [text.substring(0, maxChunkSize)];
    } catch (error) {
      console.error('Chunking error:', error);
      return [text.substring(0, maxChunkSize)];
    }
  }

  getOverlapText(text, overlapSize) {
    const words = text.split(' ');
    if (words.length <= overlapSize) return text;
    return words.slice(-overlapSize).join(' ');
  }

  contextAwareChunking(text, type = 'article') {
    const maxSize = type === 'article' ? 1000 : 512;
    const overlap = type === 'article' ? 100 : 50;
    
    return this.semanticChunking(text, maxSize, overlap);
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  async upsertArticle(article, embedding = null) {
    try {
      if (!embedding) {
        const text = `${article.title} ${article.description || ''} ${article.content || ''}`;
        embedding = await this.generateEmbedding(text);
      }

      const vector = {
        id: article.id || `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        values: embedding,
        metadata: {
          title: article.title,
          description: article.description,
          content: article.content?.substring(0, 1000), // Limit content size
          source: article.source,
          url: article.url,
          publishedAt: article.publishedAt,
          author: article.author,
          type: 'article',
          indexed_at: new Date().toISOString()
        }
      };

      // Store based on configured vector database
      if (this.vectorDatabase === 'chroma' && this.chromaService.isInitialized()) {
        await this.chromaService.addVector(vector.id, vector.values, vector.metadata);
      } else if (this.pineconeAvailable && this.index) {
        await this.index.upsert([vector]);
      } else {
        // Store in memory
        this.inMemoryVectors = this.inMemoryVectors || [];
        this.inMemoryVectors.push(vector);
        // Keep only last 1000 vectors in memory
        if (this.inMemoryVectors.length > 1000) {
          this.inMemoryVectors = this.inMemoryVectors.slice(-1000);
        }
      }
      
      return vector.id;
    } catch (error) {
      console.error('Article upsert error:', error);
      throw error;
    }
  }

  async upsertFactCheck(claim, factCheckResult, embedding = null) {
    try {
      if (!embedding) {
        embedding = await this.generateEmbedding(claim);
      }

      const vector = {
        id: `factcheck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        values: embedding,
        metadata: {
          claim: claim,
          verdict: factCheckResult.verdict,
          confidence: factCheckResult.confidence,
          evidence: factCheckResult.evidence,
          explanation: factCheckResult.explanation?.substring(0, 1000),
          type: 'factcheck',
          checked_at: new Date().toISOString()
        }
      };

      // Store based on configured vector database
      if (this.vectorDatabase === 'chroma' && this.chromaService.isInitialized()) {
        await this.chromaService.addVector(vector.id, vector.values, vector.metadata);
      } else if (this.pineconeAvailable && this.index) {
        await this.index.upsert([vector]);
      } else {
        // Store in memory
        this.inMemoryVectors = this.inMemoryVectors || [];
        this.inMemoryVectors.push(vector);
        // Keep only last 1000 vectors in memory
        if (this.inMemoryVectors.length > 1000) {
          this.inMemoryVectors = this.inMemoryVectors.slice(-1000);
        }
      }

      return vector.id;
    } catch (error) {
      console.error('Fact-check upsert error:', error);
      throw error;
    }
  }

  async searchSimilarArticles(queryEmbedding, topK = 10, filter = null) {
    try {
      // Search based on configured vector database
      if (this.vectorDatabase === 'chroma' && this.chromaService.isInitialized()) {
        const results = await this.chromaService.searchSimilar(queryEmbedding, topK, filter);
        return results.map(result => ({
          id: result.id,
          score: result.score,
          article: result.metadata
        }));
      } else if (this.pineconeAvailable && this.index) {
        const queryOptions = {
          vector: queryEmbedding,
          topK: topK,
          includeMetadata: true
        };

        if (filter) {
          queryOptions.filter = filter;
        }

        const results = await this.index.query(queryOptions);

        return results.matches.map(match => ({
          id: match.id,
          score: match.score,
          article: match.metadata
        }));
      } else {
        // In-memory search using cosine similarity
        const vectors = this.inMemoryVectors || [];
        const similarities = vectors.map(vector => {
          const similarity = this.cosineSimilarity(queryEmbedding, vector.values);
          return {
            id: vector.id,
            score: similarity,
            article: vector.metadata
          };
        });

        // Filter by type if specified
        let filteredSimilarities = similarities;
        if (filter && filter.type && filter.type.$eq) {
          filteredSimilarities = similarities.filter(item => 
            item.article.type === filter.type.$eq
          );
        }

        // Sort by similarity score and return top K
        return filteredSimilarities
          .sort((a, b) => b.score - a.score)
          .slice(0, topK);
      }
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  // Cosine similarity calculation
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  async factCheckClaim(claim) {
    try {
      const claimEmbedding = await this.generateEmbedding(claim);
      
      // Search for similar articles
      const similarArticles = await this.searchSimilarArticles(
        claimEmbedding, 
        10,
        { type: { $eq: 'article' } }
      );
      
      // Search for similar fact-checks
      const similarFactChecks = await this.searchSimilarArticles(
        claimEmbedding, 
        5,
        { type: { $eq: 'factcheck' } }
      );
      
      return {
        claim,
        similarArticles,
        similarFactChecks,
        embedding: claimEmbedding
      };
    } catch (error) {
      console.error('Fact-check claim error:', error);
      throw error;
    }
  }

  async searchByKeywords(keywords, topK = 20) {
    try {
      const keywordText = keywords.join(' ');
      const embedding = await this.generateEmbedding(keywordText);
      
      return await this.searchSimilarArticles(embedding, topK);
    } catch (error) {
      console.error('Keyword search error:', error);
      throw error;
    }
  }

  async getIndexStats() {
    try {
      if (this.pineconeAvailable && this.index) {
        const stats = await this.index.describeIndexStats();
        return {
          totalVectors: stats.totalVectorCount,
          dimension: stats.dimension,
          indexFullness: stats.indexFullness,
          namespaces: stats.namespaces
        };
      } else {
        return {
          totalVectors: this.inMemoryVectors?.length || 0,
          dimension: 384,
          indexFullness: 0,
          namespaces: { '': { vectorCount: this.inMemoryVectors?.length || 0 } }
        };
      }
    } catch (error) {
      console.error('Get index stats error:', error);
      return {
        totalVectors: 0,
        dimension: 384,
        indexFullness: 0,
        namespaces: {}
      };
    }
  }

  async deleteOldArticles(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      // Note: Pinecone doesn't support date-based filtering for deletion in the free tier
      // This would require fetching all vectors and checking dates manually
      console.log(`Delete operation would remove articles older than ${cutoffDate.toISOString()}`);
      
      // For now, just log the operation
      return { deleted: 0, message: 'Deletion not implemented in free tier' };
    } catch (error) {
      console.error('Delete old articles error:', error);
      throw error;
    }
  }
}

export default VectorService;
