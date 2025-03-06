// src/hooks/useMarketData.js
import { useState, useEffect, useCallback, useRef } from 'react';
import marketDataService from '../services/marketDataService';

/**
 * Custom hook to manage market data with caching and refresh functionality
 * @param {Object} options Configuration options
 * @returns {Object} Market data state and control functions
 */
const useMarketData = (options = {}) => {
  const {
    refreshInterval = 60000, // Default refresh every minute
    tickerRotationInterval = 5000, // How often to rotate visible tickers
    initialTickerCount = 4, // How many tickers to show initially
    enableAutoRefresh = true // Whether to auto-refresh data
  } = options;

  const [marketData, setMarketData] = useState([]);
  const [visibleTickers, setVisibleTickers] = useState([]);
  const [profitData, setProfitData] = useState({ amount: 9500.00, currency: 'USD' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Refs to track intervals and prevent memory leaks
  const dataIntervalRef = useRef(null);
  const rotationIntervalRef = useRef(null);
  const isInitialMountRef = useRef(true);

  // Select visible tickers based on screen size and current data
  const updateVisibleTickers = useCallback(() => {
    if (!marketData || marketData.length === 0) return;
    
    const isMobile = window.innerWidth < 768;
    const numVisible = isMobile ? 1 : Math.min(initialTickerCount, marketData.length);
    
    // For mobile, just take the first few tickers
    if (isMobile) {
      setVisibleTickers(marketData.slice(0, numVisible));
    } else {
      // For larger screens, shuffle and select a subset
      setVisibleTickers(
        [...marketData]
          .sort(() => Math.random() - 0.5)
          .slice(0, numVisible)
      );
    }
  }, [marketData, initialTickerCount]);

  // Fetch market data from API or use fallback
  const fetchData = useCallback(async (useFallback = false) => {
    // Skip if already loading to prevent overlapping requests
    if (loading && !isInitialMountRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use fallback data immediately if requested or if we need immediate data
      if (useFallback) {
        const fallbackData = marketDataService.getFallbackMarketData();
        setMarketData(fallbackData);
        setVisibleTickers(fallbackData);
        setLoading(false);
        return;
      }
      
      // Fetch real data from API
      const data = await marketDataService.fetchMarketData();
      
      if (data && data.length > 0) {
        setMarketData(data);
        setLastUpdated(new Date());
      } else {
        // If API returns empty data, use fallback
        const fallbackData = marketDataService.getFallbackMarketData();
        setMarketData(fallbackData);
        setVisibleTickers(fallbackData);
      }
      
      // Also update profit data
      try {
        const profit = await marketDataService.fetchDailyProfit();
        setProfitData(profit);
      } catch (profitError) {
        console.error("Error fetching profit data:", profitError);
      }
    } catch (fetchError) {
      console.error("Error fetching market data:", fetchError);
      setError(fetchError.message || "Failed to fetch market data");
      
      // Use fallback data on error
      const fallbackData = marketDataService.getFallbackMarketData();
      setMarketData(fallbackData);
      setVisibleTickers(fallbackData);
    } finally {
      setLoading(false);
      isInitialMountRef.current = false;
    }
  }, [loading]);

  // Initialize data on component mount
  useEffect(() => {
    // First load fallback data for immediate display
    fetchData(true);
    
    // Then try to fetch real data if auto-refresh is enabled
    if (enableAutoRefresh) {
      // Use a small delay to prevent immediate double loading
      const initialFetchTimeout = setTimeout(() => {
        fetchData(false);
      }, 500);
      
      return () => clearTimeout(initialFetchTimeout);
    }
  }, [fetchData, enableAutoRefresh]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (!enableAutoRefresh) return;
    
    // Clear any existing interval first
    if (dataIntervalRef.current) {
      clearInterval(dataIntervalRef.current);
    }
    
    dataIntervalRef.current = setInterval(() => {
      fetchData(false);
    }, refreshInterval);
    
    return () => {
      if (dataIntervalRef.current) {
        clearInterval(dataIntervalRef.current);
      }
    };
  }, [fetchData, refreshInterval, enableAutoRefresh]);

  // Set up ticker rotation interval
  useEffect(() => {
    // Clear any existing interval first
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
    }
    
    rotationIntervalRef.current = setInterval(() => {
      updateVisibleTickers();
    }, tickerRotationInterval);
    
    return () => {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
      }
    };
  }, [updateVisibleTickers, tickerRotationInterval]);

  // Handle screen resize for responsive ticker count
  useEffect(() => {
    // Update visible tickers initially
    updateVisibleTickers();
    
    const handleResize = () => updateVisibleTickers();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [updateVisibleTickers]);

  // Manual refresh function - for user-triggered refreshes
  const refreshData = useCallback(() => {
    fetchData(false);
  }, [fetchData]);

  // Add socket.io listener for real-time updates if available
  useEffect(() => {
    // Check if socket.io is available globally
    if (window.socket) {
      // Listen for market data updates
      window.socket.on('market-data-update', (data) => {
        if (data && data.tickers && data.tickers.length > 0) {
          setMarketData(data.tickers);
          setLastUpdated(new Date(data.timestamp) || new Date());
        }
      });
      
      return () => {
        window.socket.off('market-data-update');
      };
    }
  }, []);

  return {
    marketData,
    visibleTickers,
    profitData,
    loading,
    error,
    lastUpdated,
    refreshData
  };
};

export default useMarketData;