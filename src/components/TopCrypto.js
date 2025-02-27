import React, { useState, useEffect } from "react";
import "../styles/TopCrypto.css";

// Enhanced exchange data with more details
const exchangesData = [
  {
    id: 1,
    name: "Binance",
    logo: "/images/binance.png",
    tradingPairs: "600+",
    volume: "$50B",
    trustpilot: "4.8",
    link: "https://www.binance.com/",
    features: ["Spot", "Futures", "Margin", "Options", "Staking"],
    fees: "0.1% standard, 0.075% with BNB",
    founded: 2017,
    headquarters: "Cayman Islands",
    mobileFriendly: true,
    beginner: "Medium"
  },
  {
    id: 2,
    name: "Coinbase",
    logo: "/images/coinbase.png",
    tradingPairs: "200+",
    volume: "$3B",
    trustpilot: "4.7",
    link: "https://www.coinbase.com/",
    features: ["Spot", "Staking", "NFT", "Wallet", "Learn & Earn"],
    fees: "0.5% spread, 0.6% transaction",
    founded: 2012,
    headquarters: "United States",
    mobileFriendly: true,
    beginner: "High"
  },
  {
    id: 3,
    name: "Kraken",
    logo: "/images/kraken.png",
    tradingPairs: "150+",
    volume: "$1.5B",
    trustpilot: "4.6",
    link: "https://www.kraken.com/",
    features: ["Spot", "Futures", "Margin", "Staking", "OTC"],
    fees: "0.16% maker, 0.26% taker",
    founded: 2011,
    headquarters: "United States",
    mobileFriendly: true,
    beginner: "Medium"
  },
  {
    id: 4,
    name: "Bybit",
    logo: "/images/bybit.png",
    tradingPairs: "300+",
    volume: "$6B",
    trustpilot: "4.5",
    link: "https://www.bybit.com/",
    features: ["Spot", "Futures", "Options", "Copy Trading", "Earn"],
    fees: "0.1% maker, 0.1% taker",
    founded: 2018,
    headquarters: "Dubai",
    mobileFriendly: true,
    beginner: "Medium"
  },
  {
    id: 5,
    name: "OKX",
    logo: "/images/okx.png",
    tradingPairs: "400+",
    volume: "$10B",
    trustpilot: "4.5",
    link: "https://www.okx.com/",
    features: ["Spot", "Futures", "Options", "DeFi", "Mining Pool"],
    fees: "0.08% maker, 0.10% taker",
    founded: 2017,
    headquarters: "Seychelles",
    mobileFriendly: true,
    beginner: "Low"
  },
  {
    id: 6,
    name: "Bitfinex",
    logo: "/images/bitfinex.png",
    tradingPairs: "120+",
    volume: "$1B",
    trustpilot: "4.4",
    link: "https://www.bitfinex.com/",
    features: ["Spot", "Margin", "Derivatives", "Lending", "Staking"],
    fees: "0.1% maker, 0.2% taker",
    founded: 2012,
    headquarters: "Hong Kong",
    mobileFriendly: true,
    beginner: "Low"
  },
  {
    id: 7,
    name: "Huobi",
    logo: "/images/huobi.png",
    tradingPairs: "500+",
    volume: "$8B",
    trustpilot: "4.4",
    link: "https://www.huobi.com/",
    features: ["Spot", "Futures", "Options", "Staking", "NFT"],
    fees: "0.2% standard",
    founded: 2013,
    headquarters: "Seychelles",
    mobileFriendly: true,
    beginner: "Medium"
  },
  {
    id: 8,
    name: "KuCoin",
    logo: "/images/kucoin.png",
    tradingPairs: "700+",
    volume: "$5B",
    trustpilot: "4.3",
    link: "https://www.kucoin.com/",
    features: ["Spot", "Futures", "Margin", "Lending", "Trading Bot"],
    fees: "0.1% maker, 0.1% taker",
    founded: 2017,
    headquarters: "Seychelles",
    mobileFriendly: true,
    beginner: "Medium"
  },
  {
    id: 9,
    name: "Gate.io",
    logo: "/images/gateio.png",
    tradingPairs: "1000+",
    volume: "$2B",
    trustpilot: "4.3",
    link: "https://www.gate.io/",
    features: ["Spot", "Futures", "Options", "NFT", "Lending"],
    fees: "0.2% standard",
    founded: 2013,
    headquarters: "Cayman Islands",
    mobileFriendly: true,
    beginner: "Low"
  },
  {
    id: 10,
    name: "Bitstamp",
    logo: "/images/bitstamp.png",
    tradingPairs: "80+",
    volume: "$700M",
    trustpilot: "4.2",
    link: "https://www.bitstamp.net/",
    features: ["Spot", "Staking", "Institutional", "OTC"],
    fees: "0.5% standard, volume discounts",
    founded: 2011,
    headquarters: "Luxembourg",
    mobileFriendly: true,
    beginner: "High"
  },
];

const TopCryptoExchanges = () => {
  const [exchanges, setExchanges] = useState(exchangesData);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [expandedExchange, setExpandedExchange] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterConfig, setFilterConfig] = useState({
    beginnerFriendly: false,
    features: []
  });

  // Sort exchanges based on current config
  useEffect(() => {
    let sortedExchanges = [...exchangesData];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      sortedExchanges = sortedExchanges.filter(exchange => 
        exchange.name.toLowerCase().includes(query) || 
        exchange.features.some(feature => feature.toLowerCase().includes(query))
      );
    }
    
    // Apply beginner friendly filter
    if (filterConfig.beginnerFriendly) {
      sortedExchanges = sortedExchanges.filter(exchange => 
        exchange.beginner === "High" || exchange.beginner === "Medium"
      );
    }
    
    // Apply feature filters
    if (filterConfig.features.length > 0) {
      sortedExchanges = sortedExchanges.filter(exchange => 
        filterConfig.features.every(feature => 
          exchange.features.includes(feature)
        )
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      sortedExchanges.sort((a, b) => {
        // Handle numeric values in string format (like "$50B")
        if (sortConfig.key === 'volume') {
          const valueA = parseVolumeToNumber(a.volume);
          const valueB = parseVolumeToNumber(b.volume);
          return sortConfig.direction === 'ascending' 
            ? valueA - valueB 
            : valueB - valueA;
        }
        
        // Handle numeric ratings
        if (sortConfig.key === 'trustpilot') {
          return sortConfig.direction === 'ascending' 
            ? parseFloat(a.trustpilot) - parseFloat(b.trustpilot)
            : parseFloat(b.trustpilot) - parseFloat(a.trustpilot);
        }
        
        // Handle trading pairs
        if (sortConfig.key === 'tradingPairs') {
          const valueA = parseInt(a.tradingPairs);
          const valueB = parseInt(b.tradingPairs);
          return sortConfig.direction === 'ascending' 
            ? valueA - valueB 
            : valueB - valueA;
        }
        
        // Default string sorting
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setExchanges(sortedExchanges);
  }, [sortConfig, searchQuery, filterConfig]);

  // Helper function to convert volume strings like "$50B" to numbers for sorting
  const parseVolumeToNumber = (volumeStr) => {
    const value = parseFloat(volumeStr.replace(/[^0-9.]/g, ''));
    if (volumeStr.includes('B')) return value * 1000;
    if (volumeStr.includes('M')) return value;
    return value;
  };

  // Request sort on column header click
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Get sort indicator for column headers
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  // Toggle exchange details expansion
  const toggleExchangeDetails = (id) => {
    setExpandedExchange(expandedExchange === id ? null : id);
  };

  // Handle feature filter change
  const handleFeatureFilterChange = (feature) => {
    setFilterConfig(prev => {
      const newFeatures = prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature];
      
      return { ...prev, features: newFeatures };
    });
  };

  // Get all unique features for filter options
  const allFeatures = Array.from(
    new Set(exchangesData.flatMap(exchange => exchange.features))
  ).sort();

  // Render star rating visual
  const renderStarRating = (rating) => {
    const ratingNum = parseFloat(rating);
    const fullStars = Math.floor(ratingNum);
    const hasHalfStar = ratingNum % 1 >= 0.5;
    
    return (
      <div className="star-rating">
        {[...Array(5)].map((_, index) => (
          <span key={index} className={
            index < fullStars
              ? "star full"
              : (index === fullStars && hasHalfStar)
                ? "star half"
                : "star empty"
          }>★</span>
        ))}
        <span className="rating-number">{rating}</span>
      </div>
    );
  };

  return (
    <div className="crypto-exchanges-container">
      <div className="crypto-exchanges-header">
        <h2 className="crypto-exchanges-title">Top Cryptocurrency Exchanges</h2>
        <p className="crypto-exchanges-subtitle">Compare the best platforms to buy, sell, and trade digital assets</p>
      </div>

      <div className="crypto-exchanges-actions">
        {/* Search bar */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search exchanges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="exchange-search"
          />
          {searchQuery && (
            <button 
              className="clear-search" 
              onClick={() => setSearchQuery("")}
            >
              ×
            </button>
          )}
        </div>
        
        {/* Filters */}
        <div className="filter-container">
          <label className="beginner-filter">
            <input 
              type="checkbox" 
              checked={filterConfig.beginnerFriendly}
              onChange={() => setFilterConfig(prev => ({
                ...prev, 
                beginnerFriendly: !prev.beginnerFriendly
              }))}
            />
            Beginner Friendly
          </label>
          
          <div className="feature-filter-dropdown">
            <button className="feature-filter-button">
              Features {filterConfig.features.length > 0 && `(${filterConfig.features.length})`}
            </button>
            <div className="feature-dropdown-content">
              {allFeatures.map(feature => (
                <label key={feature} className="feature-checkbox">
                  <input 
                    type="checkbox"
                    checked={filterConfig.features.includes(feature)}
                    onChange={() => handleFeatureFilterChange(feature)}
                  />
                  {feature}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {exchanges.length === 0 ? (
        <div className="no-results">
          <p>No exchanges match your current filters</p>
          <button 
            className="reset-filters"
            onClick={() => {
              setSearchQuery("");
              setFilterConfig({ beginnerFriendly: false, features: [] });
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="crypto-exchanges-table-container">
          <table className="crypto-exchanges-table">
            <thead>
              <tr>
                <th>#</th>
                <th 
                  onClick={() => requestSort('name')}
                  className="sortable"
                >
                  Exchange {getSortIndicator('name')}
                </th>
                <th 
                  onClick={() => requestSort('tradingPairs')}
                  className="sortable"
                >
                  Trading Pairs {getSortIndicator('tradingPairs')}
                </th>
                <th 
                  onClick={() => requestSort('volume')}
                  className="sortable"
                >
                  24H Volume {getSortIndicator('volume')}
                </th>
                <th 
                  onClick={() => requestSort('trustpilot')}
                  className="sortable"
                >
                  Trustpilot {getSortIndicator('trustpilot')}
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {exchanges.map((exchange, index) => (
                <React.Fragment key={exchange.id}>
                  <tr 
                    className={expandedExchange === exchange.id ? "exchange-row expanded" : "exchange-row"}
                    onClick={() => toggleExchangeDetails(exchange.id)}
                  >
                    <td>{index + 1}</td>
                    <td className="exchange-name">
                      <img
                        src={exchange.logo}
                        alt={`${exchange.name} logo`}
                        className="exchange-logo"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/40x40?text=Logo";
                        }}
                      />
                      <span>{exchange.name}</span>
                    </td>
                    <td>{exchange.tradingPairs}</td>
                    <td className="volume-cell">{exchange.volume}</td>
                    <td>{renderStarRating(exchange.trustpilot)}</td>
                    <td>
                      <a
                        href={exchange.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="open-account-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Visit Exchange
                      </a>
                    </td>
                  </tr>
                  
                  {/* Expanded details row */}
                  {expandedExchange === exchange.id && (
                    <tr className="exchange-details-row">
                      <td colSpan="6">
                        <div className="exchange-details">
                          <div className="exchange-details-section">
                            <h4>Features</h4>
                            <div className="feature-tags">
                              {exchange.features.map(feature => (
                                <span key={feature} className="feature-tag">{feature}</span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="exchange-details-section">
                            <h4>Exchange Information</h4>
                            <div className="details-grid">
                              <div className="detail-item">
                                <span className="detail-label">Trading Fees:</span>
                                <span className="detail-value">{exchange.fees}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Founded:</span>
                                <span className="detail-value">{exchange.founded}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Headquarters:</span>
                                <span className="detail-value">{exchange.headquarters}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Mobile App:</span>
                                <span className="detail-value">{exchange.mobileFriendly ? "Available" : "Limited"}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Beginner Friendly:</span>
                                <span className="detail-value">
                                  <span className={`beginner-level ${exchange.beginner.toLowerCase()}`}>
                                    {exchange.beginner}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="exchange-cta">
                            <a
                              href={exchange.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="visit-website-btn"
                            >
                              Open Account
                            </a>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="crypto-exchanges-disclaimer">
        <p>
          <strong>Disclaimer:</strong> Cryptocurrency trading involves risk. This comparison is for informational 
          purposes only and should not be considered investment advice. Always do your own research before using 
          any exchange. Trading fees and available features may change over time.
        </p>
      </div>
    </div>
  );
};

export default TopCryptoExchanges;