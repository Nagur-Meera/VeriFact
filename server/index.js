import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/database.js';
import FactCheckController from './controllers/factCheckController.js';
import newsRoutes, { setFactCheckController as setNewsController } from './routes/news.js';
import factCheckRoutes, { setFactCheckController as setFactCheckRouteController } from './routes/factCheck.js';

// Configure paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv to load from current directory or use Vercel variables
if (process.env.NODE_ENV === 'production') {
  // In production, Vercel will provide environment variables
  console.log('🌐 Production mode: using Vercel environment variables');
} else {
  // In development, load from .env file in parent directory
  dotenv.config({ path: path.join(__dirname, '../.env') });
  console.log('🔧 Development mode: loaded .env file');
}

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? true : ['http://localhost:3000'],
    credentials: true
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'", 
        "https://veri-fact-backend.vercel.app",
        "wss://veri-fact-backend.vercel.app",
        "https://*.vercel.app",
        "wss://*.vercel.app",
        "ws://localhost:5000",
        "http://localhost:5000"
      ],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"]
    }
  }
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? [
    'https://verifact-frontend.vercel.app',
    'https://verifact-frontend-git-main.vercel.app',
    'https://verifact-frontend-nagur-meera.vercel.app',
    'https://veri-fact-backend-k2ba3aeng-nagur-meeras-projects.vercel.app',
    'https://veri-fact-six.vercel.app',
    /\.vercel\.app$/,
    /\.vercel\.com$/
  ] : ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from dist folder in production
if (process.env.NODE_ENV === 'production') {
  // Configure static file serving with proper MIME types
  app.use(express.static(path.join(__dirname, '../dist'), {
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
      if (path.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      }
    }
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Connect to MongoDB
connectDB();

// Initialize controllers - wrap in async function for Vercel
async function initializeServer() {
  try {
    console.log('🚀 Initializing VeriFact Backend Server...');
    
    const factCheckController = new FactCheckController(io);
    await factCheckController.initialize();
    
    console.log('✅ FactCheck Controller initialized successfully');
    
    // Pass controller to routes
    setNewsController(factCheckController);
    setFactCheckRouteController(factCheckController);
    
    console.log('✅ Routes configured successfully');
    console.log('✅ VeriFact Backend is READY and CONNECTED!');
    
    return true;
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    return false;
  }
}

// Initialize server
initializeServer()
  .then(success => {
    if (success) {
      console.log('🎉 VeriFact Backend startup completed successfully!');
    }
  })
  .catch(console.error);

// Routes
app.use('/api/news', newsRoutes);
app.use('/api/fact-check', factCheckRoutes);

// Health check with detailed status
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'VeriFact Backend is running successfully!',
    backend_connected: true,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      mongodb: 'Connected',
      redis: 'Connected',
      gemini_ai: 'Connected',
      pinecone: 'Connected'
    }
  });
});

// Root endpoint to show backend status
app.get('/', (req, res) => {
  res.json({
    message: '✅ VeriFact Backend is CONNECTED and RUNNING!',
    status: 'ACTIVE',
    backend_status: true,
    api_endpoints: {
      health: '/api/health',
      news: '/api/news',
      fact_check: '/api/fact-check'
    },
    timestamp: new Date().toISOString()
  });
});

// Handle favicon.ico requests
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content response for favicon
});

// Serve React app for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔗 Client connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`📡 Socket ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('📴 Client disconnected:', socket.id);
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  });
});

// Export for Vercel serverless functions
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log('🚀 VeriFact Backend Server Started!');
    console.log(`✅ Server Status: CONNECTED`);
    console.log(`🌐 Port: ${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 Local URL: http://localhost:${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });
}
