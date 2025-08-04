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

// Configure dotenv to load from parent directory or use Railway variables
if (process.env.NODE_ENV === 'production') {
  // In production, Railway will provide environment variables
  console.log('Production mode: using Railway environment variables');
} else {
  // In development, load from .env file
  dotenv.config({ path: path.join(__dirname, '../.env') });
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
        "https://verifact-production.up.railway.app",
        "wss://verifact-production.up.railway.app",
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
  origin: process.env.NODE_ENV === 'production' ? true : ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from dist folder in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
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

// Initialize controllers
const factCheckController = new FactCheckController(io);
await factCheckController.initialize();

// Pass controller to routes
setNewsController(factCheckController);
setFactCheckRouteController(factCheckController);

// Routes
app.use('/api/news', newsRoutes);
app.use('/api/fact-check', factCheckRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve React app for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
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

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
