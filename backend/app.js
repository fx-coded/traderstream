const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { errorHandler } = require('./utils/errorHandler');
const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const firebaseAdminService = require('./config/firebaseAdmin');
const fs = require('fs');
const path = require('path');

// Create Express app
const app = express();

// Security middleware with forgiving settings for development
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP to avoid issues with various content
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Request parsing with increased limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Compression for all responses
app.use(compression());

// HTTP request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: message => logger.info(message.trim()) }
}));

// Base route
app.get('/', (req, res) => {
  res.send('🔥 Trader Stream Backend is Running! 🚀');
});

// Health check endpoint
app.get('/health', async (req, res) => {
  // Check Firebase connection
  const firebaseStatus = await firebaseAdminService.healthCheck();
  
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      streaming: 'healthy',
      firebase: firebaseStatus.status
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Function to safely import routes
const safeImport = (routePath) => {
  try {
    // Normalize path to handle different path separators
    const normalizedPath = path.normalize(routePath);
    const fullPath = path.join(__dirname, normalizedPath);
    
    // Check if file exists using normalized path
    if (fs.existsSync(fullPath + '.js')) {
      return require(routePath);
    } else {
      // Check if file exists in src/ directory structure
      const srcPath = path.join(__dirname, 'src', normalizedPath);
      if (fs.existsSync(srcPath + '.js')) {
        return require('./src' + routePath);
      }
      
      logger.warn(`Route file not found: ${fullPath}.js`);
      
      // Return empty router as fallback
      const router = express.Router();
      router.all('*', (req, res) => {
        res.status(503).json({ error: 'Route not yet implemented' });
      });
      return router;
    }
  } catch (error) {
    logger.error(`Error importing route: ${routePath}`, error);
    
    // Return empty router as fallback
    const router = express.Router();
    router.all('*', (req, res) => {
      res.status(503).json({ error: 'Error loading route' });
    });
    return router;
  }
};

// Import routes
const streamRoutes = safeImport('./routes/streamRoutes');
const userRoutes = safeImport('./routes/userRoutes');
const authRoutes = safeImport('./routes/authRoutes');

// API routes with rate limiting
const apiRouter = express.Router();
app.use('/api', apiLimiter, apiRouter);

// Create fallback router
const fallbackRouter = express.Router();
fallbackRouter.all('*', (req, res) => {
  res.status(503).json({ error: 'This route is not yet implemented' });
});

// Register route groups
apiRouter.use('/auth', authRoutes || fallbackRouter);
apiRouter.use('/users', userRoutes || fallbackRouter);
apiRouter.use('/streams', streamRoutes || fallbackRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;