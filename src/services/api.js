import axios from 'axios';

// Determine the correct API URL
const getApiUrl = () => {
  // Check if we're in development mode
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    console.log('API: Development mode detected, using localhost');
    return 'http://localhost:5000';
  }
  
  // In production, use the environment variable or fallback to Render URL
  const apiUrl = import.meta.env.VITE_API_URL || 'https://verifact-fiu4.onrender.com';
  console.log('API: Production mode, using:', apiUrl);
  return apiUrl;
};

const API_BASE_URL = getApiUrl();

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Fact-checking endpoints
export const factCheckClaim = (claim) => {
  return api.post('/fact-check', { claim });
};

export const analyzeArticle = (articleData) => {
  return api.post('/fact-check/analyze', articleData);
};

// News endpoints
export const getLatestNews = (query = null, category = 'general') => {
  const params = { category };
  if (query) params.query = query;
  return api.get('/news', { params });
};

export const getTrendingTopics = () => {
  return api.get('/news/trending');
};

export const getSystemStats = () => {
  return api.get('/news/stats');
};

export const getDailyActivity = () => {
  return api.get('/news/activity');
};

// Health check
export const healthCheck = () => {
  return api.get('/health');
};

export default api;
