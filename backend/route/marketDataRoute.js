/**
 * Market Data API Routes
 * Provides endpoints for fetching market data
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Import market data service
const marketDataService = require('../services/marketDataService');

// Rate limiting to protect API and Alpha Vantage quotas
const marketApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   GET /api/market-data/tickers
 * @desc    Get all market tickers
 * @access  Public with rate limiting
 */
router.get('/tickers', marketApiLimiter, async (req, res) => {
  try {
    // Parse optional symbols parameter
    let symbols = req.query.symbols 
      ? req.query.symbols.split(',').filter(sym => marketDataService.MARKET_SYMBOLS[sym])
      : Object.keys(marketDataService.MARKET_SYMBOLS);
    
    // Limit number of symbols to prevent abuse
    const isAuthenticated = req.user ? true : false;
    const maxSymbols = isAuthenticated ? 20 : 8;
    symbols = symbols.slice(0, maxSymbols);
    
    let marketData;
    
    // If only a few symbols requested, fetch them individually
    if (symbols.length <= 5) {
      const promises = symbols.map(symbol => marketDataService.fetchSymbolData(symbol));
      const results = await Promise.all(promises);
      marketData = results.filter(data => data !== null);
    } else {
      // Fetch all and filter
      const allData = await marketDataService.fetchAllMarketData();
      marketData = allData.filter(data => symbols.includes(data.symbol));
      
      // If we didn't get enough data from the API, use fallback
      if (marketData.length < symbols.length / 2) {
        const fallbackData = marketDataService.getFallbackMarketData();
        const fallbackFiltered = fallbackData.filter(data => symbols.includes(data.symbol));
        
        // Merge unique symbols from both sources
        const existingSymbols = new Set(marketData.map(data => data.symbol));
        fallbackFiltered.forEach(data => {
          if (!existingSymbols.has(data.symbol)) {
            marketData.push(data);
          }
        });
      }
    }
    
    // Return the data
    res.json({
      tickers: marketData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in market tickers endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch market data',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * @route   GET /api/market-data/ticker/:symbol
 * @desc    Get data for a specific ticker symbol
 * @access  Public with rate limiting
 */
router.get('/ticker/:symbol', marketApiLimiter, async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Validate symbol exists
    if (!marketDataService.MARKET_SYMBOLS[symbol]) {
      return res.status(404).json({ error: 'Symbol not found' });
    }
    
    // Fetch data for the symbol
    const data = await marketDataService.fetchSymbolData(symbol);
    
    if (!data) {
      return res.status(404).json({ error: 'Data not available for symbol' });
    }
    
    res.json(data);
  } catch (error) {
    console.error(`Error fetching data for symbol ${req.params.symbol}:`, error);
    res.status(500).json({
      error: 'Failed to fetch ticker data',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * @route   GET /api/market-data/stats/profit
 * @desc    Get daily profit statistics
 * @access  Public with rate limiting
 */
router.get('/stats/profit', marketApiLimiter, async (req, res) => {
  try {
    const profitData = await marketDataService.getDailyProfitStats();
    res.json(profitData);
  } catch (error) {
    console.error('Error fetching profit stats:', error);
    res.status(500).json({
      error: 'Failed to fetch profit statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

/**
 * @route   GET /api/market-data/symbols
 * @desc    Get available market symbols
 * @access  Public
 */
router.get('/symbols', (req, res) => {
  const symbols = Object.keys(marketDataService.MARKET_SYMBOLS);
  res.json({
    symbols,
    count: symbols.length
  });
});

/**
 * @route   POST /api/market-data/cache/clear
 * @desc    Clear market data cache (admin only)
 * @access  Private
 */
router.post('/cache/clear', async (req, res) => {
  try {
    // Verify this is an admin request
    const { authorization } = req.headers;
    if (!authorization || authorization !== `Bearer ${process.env.ADMIN_API_KEY}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const result = marketDataService.clearMarketCache();
    res.json(result);
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

/**
 * @route   GET /api/market-data/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'market-data-api',
    timestamp: new Date().toISOString(),
    config: {
      symbols: Object.keys(marketDataService.MARKET_SYMBOLS).length,
      provider: 'Alpha Vantage'
    }
  });
});

module.exports = router;