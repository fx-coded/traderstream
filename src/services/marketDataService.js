/**
 * Market Data Service for Frontend
 * Browser-compatible implementation that connects to backend
 */

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache in milliseconds

// Configuration for different market symbols
const MARKET_SYMBOLS = {
  'BTC/USD': { symbol: 'BTCUSD', type: 'crypto' },
  'ETH/USD': { symbol: 'ETHUSD', type: 'crypto' },
  'SPX500': { symbol: 'SPX', type: 'index' },
  'TSLA': { symbol: 'TSLA', type: 'stock' },
  'AAPL': { symbol: 'AAPL', type: 'stock' },
  'EUR/USD': { symbol: 'EURUSD', type: 'forex' },
  'MSFT': { symbol: 'MSFT', type: 'stock' },
  'AMZN': { symbol: 'AMZN', type: 'stock' },
  'GOOGL': { symbol: 'GOOGL', type: 'stock' },
  'SPY': { symbol: 'SPY', type: 'etf' }
};

// API configuration
const API_CONFIG = {
  // Main backend API
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'https://trading-backend-1059368735900.us-central1.run.app',
  marketDataEndpoint: '/api/market-data',
  
  // Enable direct Alpha Vantage fallback (not recommended for production)
  enableDirectFallback: process.env.REACT_APP_ENABLE_DIRECT_FALLBACK === 'true',
  alphaVantageApiKey: process.env.REACT_APP_ALPHA_VANTAGE_API_KEY,
  alphaVantageUrl: 'https://www.alphavantage.co/query'
};

/**
 * Simple in-memory cache for browser
 */
class BrowserCache {
  constructor() {
    this.cache = {};
  }

  get(key) {
    const item = this.cache[key];
    if (!item) return null;
    
    // Check if expired
    if (Date.now() > item.expiry) {
      delete this.cache[key];
      return null;
    }
    
    return item.value;
  }

  set(key, value, ttlMs = CACHE_DURATION) {
    this.cache[key] = {
      value,
      expiry: Date.now() + ttlMs
    };
  }

  clear() {
    this.cache = {};
  }
}

// Initialize cache
const marketCache = new BrowserCache();

/**
 * Fetches market data from backend API
 * @returns {Promise<Array>} Array of ticker data objects
 */
export const fetchMarketData = async () => {
  try {
    // Check cache first
    const cachedData = marketCache.get('market_data');
    if (cachedData) {
      console.log('Using cached market data');
      return cachedData;
    }

    // Fetch from API
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.marketDataEndpoint}/tickers`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.tickers && data.tickers.length > 0) {
      // Cache valid results
      marketCache.set('market_data', data.tickers);
      return data.tickers;
    }
    
    throw new Error('Invalid data received from API');
  } catch (error) {
    console.error('Error fetching market data from backend:', error);
    
    // Try direct Alpha Vantage fallback if enabled
    if (API_CONFIG.enableDirectFallback) {
      return directAlphaVantageFallback();
    }
    
    // Otherwise use static fallback
    return getFallbackMarketData();
  }
};

/**
 * Helper function to get fallback market data
 * Used when API requests fail or when offline
 */
export const getFallbackMarketData = () => {
  return [
    { symbol: 'BTC/USD', price: 52304.50, change: 0.03, direction: 'up' },
    { symbol: 'ETH/USD', price: 3478.30, change: -0.39, direction: 'down' },
    { symbol: 'SPX500', price: 4975.12, change: -0.62, direction: 'down' },
    { symbol: 'TSLA', price: 202.89, change: -1.14, direction: 'down' },
    { symbol: 'AAPL', price: 185.34, change: 0.24, direction: 'up' },
    { symbol: 'EUR/USD', price: 1.0823, change: 0.11, direction: 'up' },
    { symbol: 'MSFT', price: 407.52, change: 0.78, direction: 'up' },
    { symbol: 'AMZN', price: 178.12, change: -0.88, direction: 'down' }
  ];
};

/**
 * Direct Alpha Vantage fallback (emergency use only)
 * NOTE: This should not be used in production as it may expose API key
 */
const directAlphaVantageFallback = async () => {
  try {
    // Only try for one symbol to stay within rate limits
    const symbol = 'BTC/USD';
    const config = MARKET_SYMBOLS[symbol];
    
    // Build URL
    const url = new URL(API_CONFIG.alphaVantageUrl);
    url.searchParams.append('function', 'CRYPTO_INTRADAY');
    url.searchParams.append('symbol', 'BTC');
    url.searchParams.append('market', 'USD');
    url.searchParams.append('interval', '5min');
    url.searchParams.append('apikey', API_CONFIG.alphaVantageApiKey);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if there's an error or rate limit message
    if (data['Note'] || data['Error Message']) {
      throw new Error(data['Note'] || data['Error Message']);
    }
    
    const timeSeries = data['Time Series Crypto (5min)'];
    
    if (!timeSeries) {
      throw new Error('No time series data');
    }
    
    // Get the most recent data points
    const timeKeys = Object.keys(timeSeries).sort().reverse();
    const latestData = timeSeries[timeKeys[0]];
    const prevData = timeSeries[timeKeys[1]];
    
    // Calculate percent change
    const currentPrice = parseFloat(latestData['4. close']);
    const previousPrice = parseFloat(prevData['4. close']);
    const change = ((currentPrice - previousPrice) / previousPrice) * 100;
    
    // Return as an array with one item
    return [{
      symbol,
      price: currentPrice,
      change: parseFloat(change.toFixed(2)),
      direction: change >= 0 ? 'up' : 'down'
    }];
  } catch (error) {
    console.error('Alpha Vantage fallback failed:', error);
    return getFallbackMarketData();
  }
};

/**
 * Fetches a snapshot of the latest profit (from backend or simulated)
 */
export const fetchDailyProfit = async () => {
  try {
    // Check cache first
    const cachedData = marketCache.get('profit_data');
    if (cachedData) {
      return cachedData;
    }

    // Try to fetch from API
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.marketDataEndpoint}/stats/profit`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.amount) {
      const profitData = {
        amount: data.amount,
        currency: data.currency || 'USD',
        change: data.change || 0
      };
      
      // Cache the data
      marketCache.set('profit_data', profitData);
      
      return profitData;
    }
    
    throw new Error('Invalid profit data');
  } catch (error) {
    console.error('Error fetching profit data:', error);
    
    // Return simulated data
    return {
      amount: 9500 + (Math.random() * 500 - 250), // Random variation between -250 and +250
      currency: 'USD',
      change: (Math.random() * 5 - 2.5).toFixed(2) // Random change between -2.5% and +2.5%
    };
  }
};

/**
 * Force refresh market data by clearing cache
 */
export const refreshMarketData = () => {
  marketCache.clear();
  return fetchMarketData();
};

// Create a named object before exporting it as default
const marketDataService = {
  fetchMarketData,
  getFallbackMarketData,
  fetchDailyProfit,
  refreshMarketData,
  MARKET_SYMBOLS
};

export default marketDataService;