import axios from 'axios';
import cron from 'node-cron';

class NewsService {
  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY;
    this.baseURL = 'https://newsapi.org/v2';
  }

  async fetchLatestNews(query = 'breaking news', pageSize = 20) {
    try {
      const response = await axios.get(`${this.baseURL}/everything`, {
        params: {
          q: query,
          from: new Date().toISOString().split('T')[0],
          sortBy: 'publishedAt',
          pageSize: pageSize,
          language: 'en',
          apiKey: this.newsApiKey
        }
      });

      return response.data.articles.map(article => ({
        id: this.generateId(article.url),
        title: article.title,
        description: article.description,
        content: article.content,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage,
        author: article.author
      }));
    } catch (error) {
      console.error('News API Error:', error);
      return this.getMockNews('general');
    }
  }

  async fetchTopHeadlines(country = 'us', category = 'general') {
    try {
      const response = await axios.get(`${this.baseURL}/top-headlines`, {
        params: {
          country: country,
          category: category,
          pageSize: 20,
          apiKey: this.newsApiKey
        }
      });

      return response.data.articles.map(article => ({
        id: this.generateId(article.url),
        title: article.title,
        description: article.description,
        content: article.content,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage,
        author: article.author,
        category: category
      }));
    } catch (error) {
      console.error('Top headlines error:', error);
      return this.getMockNews(category);
    }
  }

  async fetchNewsByCategory(category = 'general') {
    try {
      const response = await axios.get(`${this.baseURL}/top-headlines`, {
        params: {
          category: category,
          country: 'us',
          pageSize: 20,
          apiKey: this.newsApiKey
        },
        timeout: 10000
      });

      if (response.data.status === 'error') {
        console.warn(`NewsAPI error for ${category}:`, response.data.message);
        return this.getMockNews(category);
      }

      return response.data.articles.map(article => ({
        id: this.generateId(article.url),
        title: article.title,
        description: article.description,
        content: article.content,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage,
        author: article.author,
        category: category
      }));
    } catch (error) {
      console.error(`News by category error for ${category}:`, error.response?.data || error.message);
      console.log(`Returning mock data for ${category} category`);
      return this.getMockNews(category);
    }
  }

  async searchNews(query, sortBy = 'publishedAt', from = null, to = null) {
    try {
      const params = {
        q: query,
        sortBy: sortBy,
        language: 'en',
        pageSize: 50,
        apiKey: this.newsApiKey
      };

      if (from) params.from = from;
      if (to) params.to = to;

      const response = await axios.get(`${this.baseURL}/everything`, {
        params: params
      });

      return response.data.articles.map(article => ({
        id: this.generateId(article.url),
        title: article.title,
        description: article.description,
        content: article.content,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage,
        author: article.author
      }));
    } catch (error) {
      console.error('Search news error:', error);
      return this.getMockNews('general');
    }
  }

  startRealTimeIngestion(callback, intervalMinutes = 5) {
    const cronExpression = `*/${intervalMinutes} * * * *`;
    
    cron.schedule(cronExpression, async () => {
      try {
        console.log('Fetching latest news...');
        const articles = await this.fetchLatestNews('breaking news', 10);
        callback(articles);
      } catch (error) {
        console.error('Real-time ingestion error:', error);
      }
    });

    console.log(`Real-time news ingestion started (every ${intervalMinutes} minutes)`);
  }

  async getTrendingTopics(timeframe = '24h') {
    try {
      // Check cache first
      const cachedTrending = await this.redisService?.getCachedData('trending_topics');
      if (cachedTrending) {
        return cachedTrending;
      }

      const categories = ['general', 'business', 'technology', 'science', 'health'];
      const allArticles = [];

      for (const category of categories) {
        try {
          const articles = await this.fetchNewsByCategory(category);
          allArticles.push(...articles);
        } catch (error) {
          console.error(`Error fetching ${category} news:`, error);
        }
      }

      const keywordCounts = new Map();
      allArticles.forEach(article => {
        const keywords = this.extractKeywords(article.title + ' ' + (article.description || ''));
        keywords.forEach(keyword => {
          keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
        });
      });

      const trending = Array.from(keywordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([keyword, count]) => ({
          topic: keyword,
          frequency: count,
          category: 'trending'
        }));

      // Cache for 30 minutes
      await this.redisService?.cacheData('trending_topics', trending, 1800);

      return trending;
    } catch (error) {
      console.error('Trending topics error:', error);
      return [
        { topic: 'technology', frequency: 15, category: 'trending' },
        { topic: 'climate', frequency: 12, category: 'trending' },
        { topic: 'economy', frequency: 10, category: 'trending' },
        { topic: 'politics', frequency: 8, category: 'trending' },
        { topic: 'health', frequency: 7, category: 'trending' }
      ];
    }
  }

  extractKeywords(text) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
      'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'says', 'said', 'new',
      'also', 'after', 'first', 'get', 'make', 'most', 'over', 'such', 'take', 'than', 'them',
      'well', 'were', 'what', 'when', 'where', 'who', 'will', 'with', 'would', 'year', 'years'
    ]);

    if (!text) return [];

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !stopWords.has(word) && 
        !/^\d+$/.test(word) && 
        !word.includes('http') &&
        !word.includes('www')
      )
      .slice(0, 20); // Limit to first 20 meaningful words per article
  }

  generateId(url) {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString();
  }

  getMockNews(category = 'general') {
    const mockArticles = {
      general: [
        {
          id: 'mock-1',
          title: 'Breaking: Technology Advances Continue to Shape 2025',
          description: 'Major technological breakthroughs are transforming industries worldwide as we move through 2025.',
          content: 'Sample content for demonstration purposes...',
          url: 'https://example.com/tech-advances-2025',
          source: 'Tech News Today',
          publishedAt: new Date().toISOString(),
          urlToImage: null,
          author: 'Tech Reporter',
          category: category
        }
      ],
      science: [
        {
          id: 'mock-science-1',
          title: 'Climate Research Shows Promising New Solutions',
          description: 'Scientists announce breakthrough in carbon capture technology.',
          content: 'Sample science content for demonstration...',
          url: 'https://example.com/climate-breakthrough',
          source: 'Science Daily',
          publishedAt: new Date().toISOString(),
          urlToImage: null,
          author: 'Science Correspondent',
          category: category
        }
      ],
      technology: [
        {
          id: 'mock-tech-1',
          title: 'AI Developments Accelerate in 2025',
          description: 'Artificial intelligence continues to advance with new applications.',
          content: 'Sample technology content...',
          url: 'https://example.com/ai-developments',
          source: 'Tech Times',
          publishedAt: new Date().toISOString(),
          urlToImage: null,
          author: 'AI Reporter',
          category: category
        }
      ]
    };

    return mockArticles[category] || mockArticles.general;
  }
}

export default NewsService;
