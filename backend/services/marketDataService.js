/**
 * Market Data Service for Backend
 * Server-side implementation for Alpha Vantage API integration
 */

const axios = require('axios');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Firestore reference
const db = admin.firestore();

// Initialize simple in-memory cache
const marketCache = {
  data: new Map(),
  set: function(key, value, ttl = 300000) { // Default 5 minutes TTL
    this.data.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  },
  get: function(key) {
    const item = this.data.get(key);
    if (!item) return null;
    
    // Check if expired
    if (Date.now() > item.expiry) {
      this.data.delete(key);
      return null;
    }
    
    return item.value;
  },
  clear: function() {
    this.data.clear();
  }
};

// Alpha Vantage API configuration
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

// Configuration for different market symbols
const MARKET_SYMBOLS = {
  'BTC/USD': { symbol: 'BTCUSD', function: 'CRYPTO_INTRADAY', interval: '5min' },
  'ETH/USD': { symbol: 'ETHUSD', function: 'CRYPTO_INTRADAY', interval: '5min' },
  'SPX500': { symbol: 'SPX', function: 'TIME_SERIES_DAILY', interval: null },
  'TSLA': { symbol: 'TSLA', function: 'TIME_SERIES_DAILY', interval: null },
  'AAPL': { symbol: 'AAPL', function: 'TIME_SERIES_DAILY', interval: null },
  'EUR/USD': { symbol: 'EURUSD', function: 'FX_INTRADAY', interval: '5min' },
  'MSFT': { symbol: 'MSFT', function: 'TIME_SERIES_DAILY', interval: null },
  'AMZN': { symbol: 'AMZN', function: 'TIME_SERIES_DAILY', interval: null },
  'GOOGL': { symbol: 'GOOGL', function: 'TIME_SERIES_DAILY', interval: null },
  'SPY': { symbol: 'SPY', function: 'TIME_SERIES_DAILY', interval: null }
};

/**
 * Formats a stock/crypto time series data point
 * @param {Object} latestData - Latest data point
 * @param {Object} prevData - Previous data point for comparison
 * @param {string} symbol - Market symbol
 * @returns {Object} Formatted market data
 */
const formatTimeSeriesData = (latestData, prevData, symbol) => {
  if (!latestData || !prevData) return null;
  
  // Extract close prices - handle different API response formats
  const currentPrice = parseFloat(
    latestData['4. close'] || 
    latestData['4. close (USD)'] || 
    latestData['4a. close (USD)'] || 
    latestData['4. Close'] ||
    latestData['close']
  );
  
  const previousPrice = parseFloat(
    prevData['4. close'] || 
    prevData['4. close (USD)'] || 
    prevData['4a. close (USD)'] || 
    prevData['4. Close'] ||
    prevData['close']
  );
  
  // Calculate percent change
  const change = ((currentPrice - previousPrice) / previousPrice) * 100;
  
  return {
    symbol,
    price: currentPrice,
    change: parseFloat(change.toFixed(2)),
    direction: change >= 0 ? 'up' : 'down',
    volume: parseFloat(latestData['5. volume'] || latestData['volume'] || 0),
    high24h: parseFloat(latestData['2. high'] || latestData['high'] || 0),
    low24h: parseFloat(latestData['3. low'] || latestData['low'] || 0),
    last_updated: new Date().toISOString()
  };
};

/**
 * Process data based on the function type
 */
const processData = (data, displaySymbol, func) => {
  if (!data) return null;
  
  let timeSeries;
  
  // Extract the time series based on function type
  if (func.includes('CRYPTO')) {
    timeSeries = data['Time Series Crypto (5min)'];
  } else if (func.includes('FX')) {
    timeSeries = data['Time Series FX (5min)'];
  } else if (func.includes('DAILY')) {
    timeSeries = data['Time Series (Daily)'];
  } else {
    timeSeries = data['Time Series (5min)'];
  }
  
  // If no time series data found
  if (!timeSeries) {
    console.log('No time series data found for', displaySymbol, 'in API response:', Object.keys(data));
    return null;
  }
  
  const timeKeys = Object.keys(timeSeries).sort().reverse();
  
  // Need at least two data points to calculate change
  if (timeKeys.length < 2) return null;
  
  return formatTimeSeriesData(
    timeSeries[timeKeys[0]],
    timeSeries[timeKeys[1]],
    displaySymbol
  );
};

/**
 * Fetches data for a single market symbol
 */
const fetchSymbolData = async (displaySymbol) => {
  // Check if data is in cache
  const cacheKey = `market_${displaySymbol}`;
  const cachedData = marketCache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    const config = MARKET_SYMBOLS[displaySymbol];
    if (!config) return null;
    
    const { symbol, function: func, interval } = config;
    
    // Build request parameters
    const params = {
      function: func,
      symbol,
      apikey: ALPHA_VANTAGE_API_KEY
    };
    
    // Only add interval for functions that require it
    if (interval) {
      params.interval = interval;
    }
    
    // For FX data, need from_symbol and to_symbol
    if (func.includes('FX')) {
      const currencies = symbol.match(/.{1,3}/g);
      params.from_symbol = currencies[0];
      params.to_symbol = currencies[1];
      delete params.symbol;
    }
    
    console.log(`Fetching data for ${displaySymbol} with params:`, params);
    
    // Make API request
    const response = await axios.get(BASE_URL, {
      params,
      headers: {
        'User-Agent': 'TradeStream/1.0'
      },
      timeout: 10000 // 10 second timeout
    });
    
    // Check for Alpha Vantage error messages
    if (response.data && response.data.Note) {
      console.warn(`Alpha Vantage rate limit: ${response.data.Note}`);
      throw new Error('API rate limit exceeded');
    }
    
    if (response.data && response.data['Error Message']) {
      throw new Error(response.data['Error Message']);
    }
    
    // Process the data
    const processedData = processData(response.data, displaySymbol, func);
    
    if (processedData) {
      console.log(`Successfully processed data for ${displaySymbol}:`, processedData);
      
      // Store in cache
      marketCache.set(cacheKey, processedData);
      
      // Also store in Firestore for persistence
      try {
        await db.collection('marketData').doc(displaySymbol).set({
          ...processedData,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (dbError) {
        console.error(`Failed to store market data in Firestore: ${dbError.message}`);
      }
      
      return processedData;
    } else {
      console.warn(`No processed data for ${displaySymbol}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching data for ${displaySymbol}:`, error.message);
    
    // Try to get from Firestore if API call fails
    try {
      const doc = await db.collection('marketData').doc(displaySymbol).get();
      if (doc.exists) {
        const firestoreData = doc.data();
        // Check if data is not too old (within 1 hour)
        const timestamp = firestoreData.timestamp.toDate();
        if (Date.now() - timestamp.getTime() < 60 * 60 * 1000) {
          return firestoreData;
        }
      }
    } catch (dbError) {
      console.error(`Firestore fallback error for ${displaySymbol}:`, dbError);
    }
    
    return null;
  }
};

/**
 * Fetches market data for all symbols
 */
const fetchAllMarketData = async () => {
  console.log('Fetching all market data');
  
  // Check if batch result is cached
  const batchCacheKey = 'market_data_batch';
  const cachedBatch = marketCache.get(batchCacheKey);
  
  if (cachedBatch) {
    console.log('Using cached market data');
    return cachedBatch;
  }
  
  try {
    // Try with a single stock first to test API connectivity
    const singleStock = await fetchSymbolData('AAPL');
    
    if (singleStock) {
      console.log('Successfully fetched real data for AAPL, continuing with more symbols');
      
      // Get a few more symbols
      const results = [singleStock];
      
      // Just get a few more to avoid rate limits
      const additionalSymbols = ['MSFT', 'BTC/USD'];
      
      for (const symbol of additionalSymbols) {
        try {
          // Add a small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const data = await fetchSymbolData(symbol);
          if (data) {
            results.push(data);
          }
        } catch (err) {
          console.warn(`Failed to fetch ${symbol}, continuing with next symbol`);
        }
      }
      
      // Cache successful results
      if (results.length > 0) {
        marketCache.set(batchCacheKey, results, 300000); // 5 min cache
        return results;
      }
    }
    
    // Try to get from Firestore as a fallback
    console.log('Trying to fetch market data from Firestore');
    const snapshot = await db.collection('marketData').get();
    
    if (!snapshot.empty) {
      const firestoreData = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        // Check if data is recent (within 10 minutes)
        if (data.timestamp && Date.now() - data.timestamp.toDate().getTime() < 10 * 60 * 1000) {
          firestoreData.push(data);
        }
      });
      
      if (firestoreData.length > 0) {
        console.log(`Found ${firestoreData.length} recent market data entries in Firestore`);
        marketCache.set(batchCacheKey, firestoreData, 60000); // Cache for 1 minute
        return firestoreData;
      }
    }
    
    console.log('No recent data found, using fallback market data');
    // If no recent data in Firestore, or not enough symbols, use fallback
    const fallbackData = getFallbackMarketData();
    
    // Try to update data asynchronously but return fallback immediately
    updateMarketDataAsync();
    
    return fallbackData;
  } catch (error) {
    console.error('Error fetching all market data:', error);
    return getFallbackMarketData();
  }
};

/**
 * Update market data asynchronously without blocking response
 */
const updateMarketDataAsync = async () => {
  const symbols = Object.keys(MARKET_SYMBOLS);
  const results = [];
  
  // Process symbols in batches to respect API rate limits
  const processBatch = async (symbols) => {
    const batchPromises = symbols.map(symbol => fetchSymbolData(symbol));
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    });
  };
  
  try {
    // Process symbols in batches of 5 to avoid rate limits
    for (let i = 0; i < symbols.length; i += 5) {
      const batch = symbols.slice(i, i + 5);
      await processBatch(batch);
      
      // Wait between batches
      if (i + 5 < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 60000)); // 60s delay between batches
      }
    }
    
    // Cache the results if we have any
    if (results.length > 0) {
      marketCache.set('market_data_batch', results, 300000); // 5 minutes cache
    }
    
    console.log(`Updated market data for ${results.length} symbols`);
  } catch (error) {
    console.error('Error in background market data update:', error);
  }
};

/**
 * Get fallback market data for when API is unavailable
 */
const getFallbackMarketData = () => {
  return [
    { symbol: 'BTC/USD', price: 52304.50, change: 0.03, direction: 'up', last_updated: new Date().toISOString() },
    { symbol: 'ETH/USD', price: 3478.30, change: -0.39, direction: 'down', last_updated: new Date().toISOString() },
    { symbol: 'SPX500', price: 4975.12, change: -0.62, direction: 'down', last_updated: new Date().toISOString() },
    { symbol: 'TSLA', price: 202.89, change: -1.14, direction: 'down', last_updated: new Date().toISOString() },
    { symbol: 'AAPL', price: 185.34, change: 0.24, direction: 'up', last_updated: new Date().toISOString() },
    { symbol: 'EUR/USD', price: 1.0823, change: 0.11, direction: 'up', last_updated: new Date().toISOString() },
    { symbol: 'MSFT', price: 407.52, change: 0.78, direction: 'up', last_updated: new Date().toISOString() },
    { symbol: 'AMZN', price: 178.12, change: -0.88, direction: 'down', last_updated: new Date().toISOString() }
  ];
};

/**
 * Generate daily profit statistics
 * In a real app, this would come from actual user data
 */
const getDailyProfitStats = async () => {
  // Check if data is in cache
  const cacheKey = 'daily_profit_stats';
  const cachedData = marketCache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Try to get stored profit data from Firestore
    const doc = await db.collection('marketStats').doc('dailyProfit').get();
    
    if (doc.exists) {
      const firestoreData = doc.data();
      
      // Check if data is recent (within 1 hour)
      const timestamp = firestoreData.timestamp.toDate();
      if (Date.now() - timestamp.getTime() < 60 * 60 * 1000) {
        // Cache for 5 minutes
        marketCache.set(cacheKey, firestoreData, 300000);
        return firestoreData;
      }
    }
    
    // Generate fresh data if no valid data in Firestore
    const baseProfit = 9500;
    const variation = Math.random() * 1000 - 500; // Random variation between -500 and +500
    
    const profitData = {
      amount: parseFloat((baseProfit + variation).toFixed(2)),
      currency: 'USD',
      change: parseFloat((Math.random() * 5 - 2.5).toFixed(2)), // Random change between -2.5% and +2.5%
      timestamp: new Date().toISOString()
    };
    
    // Store in Firestore
    await db.collection('marketStats').doc('dailyProfit').set({
      ...profitData,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Cache for 5 minutes
    marketCache.set(cacheKey, profitData, 300000);
    
    return profitData;
  } catch (error) {
    console.error('Error fetching/generating profit stats:', error);
    
    // Return default data on error
    return {
      amount: 9500.75,
      currency: 'USD',
      change: 2.3,
      timestamp: new Date().toISOString()
    };
  }
};

// Cache management functions
const clearMarketCache = () => {
  marketCache.clear();
  return { success: true, message: 'Market data cache cleared' };
};

// Public API
module.exports = {
  fetchSymbolData,
  fetchAllMarketData,
  getFallbackMarketData,
  getDailyProfitStats,
  clearMarketCache,
  MARKET_SYMBOLS
};