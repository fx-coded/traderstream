// src/services/marketDataService.js
// src/services/marketDataService.js
const ALPHA_VANTAGE_API_KEY = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

// Configuration for different market symbols
const MARKET_SYMBOLS = {
  'BTC/USD': { symbol: 'BTCUSD', function: 'CRYPTO_INTRADAY', interval: '5min' },
  'ETH/USD': { symbol: 'ETHUSD', function: 'CRYPTO_INTRADAY', interval: '5min' },
  'SPX500': { symbol: 'SPX', function: 'TIME_SERIES_INTRADAY', interval: '5min' },
  'TSLA': { symbol: 'TSLA', function: 'TIME_SERIES_INTRADAY', interval: '5min' },
  'AAPL': { symbol: 'AAPL', function: 'TIME_SERIES_INTRADAY', interval: '5min' },
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
  
  // Extract close prices
  const currentPrice = parseFloat(latestData['4. close'] || latestData['4. close (USD)']);
  const previousPrice = parseFloat(prevData['4. close'] || prevData['4. close (USD)']);
  
  // Calculate percent change
  const change = ((currentPrice - previousPrice) / previousPrice) * 100;
  
  return {
    symbol,
    price: currentPrice,
    change: parseFloat(change.toFixed(2)),
    direction: change >= 0 ? 'up' : 'down'
  };
};

/**
 * Processes crypto data from Alpha Vantage
 */
const processCryptoData = (data, symbol) => {
  if (!data || !data['Time Series Crypto (5min)']) return null;
  
  const timeSeries = data['Time Series Crypto (5min)'];
  const timeKeys = Object.keys(timeSeries).sort().reverse();
  
  if (timeKeys.length < 2) return null;
  
  return formatTimeSeriesData(
    timeSeries[timeKeys[0]],
    timeSeries[timeKeys[1]],
    symbol
  );
};

/**
 * Processes stock data from Alpha Vantage
 */
const processStockData = (data, symbol) => {
  if (!data || !data['Time Series (5min)']) return null;
  
  const timeSeries = data['Time Series (5min)'];
  const timeKeys = Object.keys(timeSeries).sort().reverse();
  
  if (timeKeys.length < 2) return null;
  
  return formatTimeSeriesData(
    timeSeries[timeKeys[0]],
    timeSeries[timeKeys[1]],
    symbol
  );
};

/**
 * Fetches data for a single market symbol using browser's fetch API
 */
const fetchSymbolData = async (displaySymbol) => {
  try {
    const config = MARKET_SYMBOLS[displaySymbol];
    if (!config) return null;
    
    const { symbol, function: func, interval } = config;
    
    // Build URL with query parameters
    const url = new URL(BASE_URL);
    url.searchParams.append('function', func);
    url.searchParams.append('symbol', symbol);
    url.searchParams.append('interval', interval);
    url.searchParams.append('apikey', ALPHA_VANTAGE_API_KEY);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'TradeStream Platform'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API response error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process based on data type
    if (func.includes('CRYPTO')) {
      return processCryptoData(data, displaySymbol);
    } else {
      return processStockData(data, displaySymbol);
    }
  } catch (error) {
    console.error(`Error fetching data for ${displaySymbol}:`, error);
    return null;
  }
};

/**
 * Fetches market data for all symbols
 * Implements rate limiting to prevent API quota issues
 */
export const fetchMarketData = async () => {
  const symbols = Object.keys(MARKET_SYMBOLS);
  const results = [];
  
  // Alpha Vantage has strict rate limits (5 calls per minute for free tier)
  // So we fetch one at a time with a delay
  for (const symbol of symbols) {
    const data = await fetchSymbolData(symbol);
    if (data) {
      results.push(data);
    }
    
    // Wait 12 seconds between requests to stay under rate limit
    if (symbol !== symbols[symbols.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 12000));
    }
  }
  
  return results;
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
  ];
};

/**
 * Fetches a snapshot of the latest profit (simulated)
 * In a real app, this would connect to your backend
 */
export const fetchDailyProfit = async () => {
  // Simulating an API call with randomized data
  return new Promise((resolve) => {
    setTimeout(() => {
      const baseProfit = 9500;
      const variation = Math.random() * 500 - 250; // Random variation between -250 and +250
      resolve({
        amount: baseProfit + variation,
        currency: 'USD'
      });
    }, 1000);
  });
};

// Create a named object before exporting it as default
const marketDataService = {
  fetchMarketData,
  getFallbackMarketData,
  fetchDailyProfit
};

export default marketDataService;