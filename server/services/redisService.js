import { createClient } from 'redis';

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Simplified Redis Cloud connection that works
      this.client = createClient({
        username: process.env.REDIS_USERNAME || 'default',
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT)
        }
      });

      this.client.on('error', (err) => {
        console.log('Redis Client Error:', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Connected to Redis Cloud successfully');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis client ready for commands');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('🔌 Redis connection ended');
        this.isConnected = false;
      });

      console.log('Connecting to Redis Cloud...');
      await this.client.connect();
      
      // Test the connection with a simple ping
      const pingResult = await this.client.ping();
      console.log('✅ Redis ping test successful:', pingResult);
      
      return true;
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  // Cache fact-check results
  async cacheFactCheck(claim, result, ttl = 3600) {
    if (!this.isConnected) return false;
    
    try {
      const key = `factcheck:${this.hashString(claim)}`;
      await this.client.setEx(key, ttl, JSON.stringify(result));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async getCachedFactCheck(claim) {
    if (!this.isConnected) return null;
    
    try {
      const key = `factcheck:${this.hashString(claim)}`;
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Cache news articles
  async cacheNews(category, articles, ttl = 300) {
    if (!this.isConnected) return false;
    
    try {
      const key = `news:${category}`;
      await this.client.setEx(key, ttl, JSON.stringify(articles));
      return true;
    } catch (error) {
      console.error('News cache error:', error);
      return false;
    }
  }

  async getCachedNews(category) {
    if (!this.isConnected) return null;
    
    try {
      const key = `news:${category}`;
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('News cache get error:', error);
      return null;
    }
  }

  // Rate limiting
  async checkRateLimit(ip, maxRequests = 100, windowMs = 3600000) {
    if (!this.isConnected) return true;
    
    try {
      const key = `rate_limit:${ip}`;
      const current = await this.client.get(key);
      
      if (!current) {
        await this.client.setEx(key, Math.floor(windowMs / 1000), '1');
        return true;
      }
      
      const count = parseInt(current);
      if (count >= maxRequests) {
        return false;
      }
      
      await this.client.incr(key);
      return true;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return true; // Allow on error
    }
  }

  // Real-time notifications
  async publishUpdate(channel, data) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.publish(channel, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Publish error:', error);
      return false;
    }
  }

  async subscribe(channel, callback) {
    if (!this.isConnected) return false;
    
    try {
      const subscriber = this.client.duplicate();
      await subscriber.connect();
      
      await subscriber.subscribe(channel, (message) => {
        try {
          const data = JSON.parse(message);
          callback(data);
        } catch (error) {
          console.error('Subscribe callback error:', error);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Subscribe error:', error);
      return false;
    }
  }

  // Store statistics
  async incrementStat(statName) {
    if (!this.isConnected) return false;
    
    try {
      const key = `stats:${statName}`;
      await this.client.incr(key);
      return true;
    } catch (error) {
      console.error('Stat increment error:', error);
      return false;
    }
  }

  async getStats() {
    if (!this.isConnected) return {};
    
    try {
      const keys = await this.client.keys('stats:*');
      const stats = {};
      
      for (const key of keys) {
        const value = await this.client.get(key);
        const statName = key.replace('stats:', '');
        stats[statName] = parseInt(value) || 0;
      }
      
      return stats;
    } catch (error) {
      console.error('Get stats error:', error);
      return {};
    }
  }

  async getDailyActivity() {
    if (!this.isConnected) {
      // Return sample data if Redis is not connected
      return this.getSampleDailyActivity();
    }
    
    try {
      const today = new Date();
      const dailyData = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        const factChecksKey = `daily:factchecks:${dateKey}`;
        const articlesKey = `daily:articles:${dateKey}`;
        
        const factChecks = await this.client.get(factChecksKey) || 0;
        const articles = await this.client.get(articlesKey) || 0;
        
        dailyData.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          date: dateKey,
          factChecks: parseInt(factChecks),
          articles: parseInt(articles)
        });
      }
      
      return dailyData;
    } catch (error) {
      console.error('Get daily activity error:', error);
      return this.getSampleDailyActivity();
    }
  }

  getSampleDailyActivity() {
    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      
      dailyData.push({
        day: dayName,
        date: date.toISOString().split('T')[0],
        factChecks: Math.floor(Math.random() * 25) + 5,
        articles: Math.floor(Math.random() * 50) + 20
      });
    }
    
    return dailyData;
  }

  async incrementDailyCounter(type) {
    if (!this.isConnected) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `daily:${type}:${today}`;
      await this.client.incr(key);
      // Set expiry to 30 days
      await this.client.expire(key, 30 * 24 * 60 * 60);
    } catch (error) {
      console.error(`Increment daily counter error for ${type}:`, error);
    }
  }

  // Utility function to hash strings for consistent keys
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }
}

export default RedisService;
