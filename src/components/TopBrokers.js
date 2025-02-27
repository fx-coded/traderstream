import React, { useState, useEffect } from "react";
import "../styles/TopBrokers.css";

// Import all images properly
import icMarketsLogo from "./images/ic_markets.png";
import pepperstoneLogo from "./images/pepperstone.png";
import oandaLogo from "./images/oanda.png";
import xmLogo from "./images/xm.png";
import fpMarketsLogo from "./images/fp-markets.png";
import forexComLogo from "./images/forexcom.png";
import fxtmLogo from "./images/fxtm.png";
import admiralsLogo from "./images/admirals.png";
import axiTraderLogo from "./images/axitrader.png";
import eightcapLogo from "./images/eightcap.png";

// Default broker data
const brokersData = [
  { 
    id: 1,
    name: "IC Markets", 
    logo: icMarketsLogo, 
    leverage: "1:500", 
    minDeposit: "$200", 
    rating: "4.9",
    spreadFrom: "0.0 pips",
    tradingPlatforms: ["MT4", "MT5", "cTrader"],
    established: "2007",
    regulated: true,
    regulators: ["ASIC", "CySEC", "FSA"],
    popularFor: "Low spreads & fast execution",
    link: "https://www.icmarkets.com/"
  },
  { 
    id: 2,
    name: "Pepperstone", 
    logo: pepperstoneLogo, 
    leverage: "1:500", 
    minDeposit: "$200", 
    rating: "4.8",
    spreadFrom: "0.0 pips",
    tradingPlatforms: ["MT4", "MT5", "cTrader"],
    established: "2010",
    regulated: true,
    regulators: ["ASIC", "FCA", "CySEC", "DFSA", "SCB"],
    popularFor: "Institutional-grade execution",
    link: "https://www.pepperstone.com/"
  },
  { 
    id: 3,
    name: "OANDA", 
    logo: oandaLogo, 
    leverage: "1:100", 
    minDeposit: "$0", 
    rating: "4.7",
    spreadFrom: "0.1 pips",
    tradingPlatforms: ["fxTrade", "MT4"],
    established: "1996",
    regulated: true,
    regulators: ["FCA", "CFTC", "ASIC", "MAS"],
    popularFor: "Advanced charting & historical data",
    link: "https://www.oanda.com/"
  },
  { 
    id: 4,
    name: "XM", 
    logo: xmLogo, 
    leverage: "1:888", 
    minDeposit: "$5", 
    rating: "4.6",
    spreadFrom: "0.1 pips",
    tradingPlatforms: ["MT4", "MT5"],
    established: "2009",
    regulated: true,
    regulators: ["CySEC", "ASIC", "IFSC"],
    popularFor: "Accessible to beginners",
    link: "https://www.xm.com/"
  },
  { 
    id: 5,
    name: "FP Markets", 
    logo: fpMarketsLogo, 
    leverage: "1:500", 
    minDeposit: "$100", 
    rating: "4.6",
    spreadFrom: "0.0 pips",
    tradingPlatforms: ["MT4", "MT5", "Iress"],
    established: "2005",
    regulated: true,
    regulators: ["ASIC", "CySEC"],
    popularFor: "Raw ECN accounts",
    link: "https://www.fpmarkets.com/"
  },
  { 
    id: 6,
    name: "Forex.com", 
    logo: forexComLogo, 
    leverage: "1:200", 
    minDeposit: "$100", 
    rating: "4.5",
    spreadFrom: "0.2 pips",
    tradingPlatforms: ["MT4", "MT5", "Advanced Platform"],
    established: "2001",
    regulated: true,
    regulators: ["CFTC", "NFA", "FCA", "DFSA"],
    popularFor: "Global presence & reliability",
    link: "https://www.forex.com/"
  },
  { 
    id: 7,
    name: "FXTM", 
    logo: fxtmLogo, 
    leverage: "1:2000", 
    minDeposit: "$10", 
    rating: "4.4",
    spreadFrom: "0.1 pips",
    tradingPlatforms: ["MT4", "MT5"],
    established: "2011",
    regulated: true,
    regulators: ["CySEC", "FCA", "FSCA"],
    popularFor: "Educational resources",
    link: "https://www.forextime.com/"
  },
  { 
    id: 8,
    name: "Admirals", 
    logo: admiralsLogo, 
    leverage: "1:500", 
    minDeposit: "$100", 
    rating: "4.4",
    spreadFrom: "0.1 pips",
    tradingPlatforms: ["MT4", "MT5"],
    established: "2001",
    regulated: true,
    regulators: ["FCA", "CySEC", "ASIC", "FSCA"],
    popularFor: "Premium analytics tools",
    link: "https://admirals.com/"
  },
  { 
    id: 9,
    name: "AxiTrader", 
    logo: axiTraderLogo, 
    leverage: "1:400", 
    minDeposit: "$0", 
    rating: "4.3",
    spreadFrom: "0.0 pips",
    tradingPlatforms: ["MT4", "MT5"],
    established: "2007",
    regulated: true,
    regulators: ["ASIC", "FCA", "DFSA"],
    popularFor: "Algorithmic trading",
    link: "https://www.axitrader.com/"
  },
  { 
    id: 10,
    name: "Eightcap", 
    logo: eightcapLogo, 
    leverage: "1:500", 
    minDeposit: "$100", 
    rating: "4.3",
    spreadFrom: "0.0 pips",
    tradingPlatforms: ["MT4", "MT5"],
    established: "2009",
    regulated: true,
    regulators: ["ASIC", "FCA", "SCB"],
    popularFor: "Competitive trading conditions",
    link: "https://www.eightcap.com/"
  }
];

const TopBrokers = () => {
  const [brokers, setBrokers] = useState(brokersData);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [expandedBroker, setExpandedBroker] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState({
    minDeposit: "all",
    leverage: "all",
    regulated: "all"
  });

  // Sort brokers based on current config
  useEffect(() => {
    let sortedBrokers = [...brokersData];
    
    if (sortConfig.key) {
      sortedBrokers.sort((a, b) => {
        // Special case for rating which should be sorted as numbers
        if (sortConfig.key === 'rating') {
          return sortConfig.direction === 'ascending' 
            ? parseFloat(a.rating) - parseFloat(b.rating)
            : parseFloat(b.rating) - parseFloat(a.rating);
        }
        
        // Special case for minDeposit which should be sorted as numbers
        if (sortConfig.key === 'minDeposit') {
          const depositA = parseInt(a.minDeposit.replace(/[^0-9]/g, ''));
          const depositB = parseInt(b.minDeposit.replace(/[^0-9]/g, ''));
          return sortConfig.direction === 'ascending' 
            ? depositA - depositB
            : depositB - depositA;
        }
        
        // Default sorting for string values
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    // Apply filters
    if (selectedFilter.minDeposit !== "all") {
      const maxDeposit = parseInt(selectedFilter.minDeposit);
      sortedBrokers = sortedBrokers.filter(broker => {
        const deposit = parseInt(broker.minDeposit.replace(/[^0-9]/g, ''));
        return deposit <= maxDeposit;
      });
    }
    
    if (selectedFilter.leverage !== "all") {
      sortedBrokers = sortedBrokers.filter(broker => {
        const brokerLeverage = parseInt(broker.leverage.split(':')[1]);
        const filterLeverage = parseInt(selectedFilter.leverage.split(':')[1]);
        return brokerLeverage >= filterLeverage;
      });
    }
    
    if (selectedFilter.regulated !== "all") {
      sortedBrokers = sortedBrokers.filter(broker => 
        selectedFilter.regulated === "true" ? broker.regulated : !broker.regulated
      );
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      sortedBrokers = sortedBrokers.filter(broker => 
        broker.name.toLowerCase().includes(query) || 
        broker.popularFor.toLowerCase().includes(query) ||
        broker.tradingPlatforms.some(platform => platform.toLowerCase().includes(query))
      );
    }
    
    setBrokers(sortedBrokers);
  }, [sortConfig, searchQuery, selectedFilter]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  const handleBrokerClick = (brokerId) => {
    setExpandedBroker(expandedBroker === brokerId ? null : brokerId);
  };

  const handleFilterChange = (filterType, value) => {
    setSelectedFilter(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

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
    <div className="brokers-container">
      <div className="brokers-header">
        <h2 className="brokers-title">Top Forex & CFD Brokers</h2>
        <p className="brokers-subtitle">Compare the best trading platforms for your needs</p>
      </div>
      
      <div className="brokers-actions">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search brokers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="broker-search"
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
        
        <div className="filter-container">
          <div className="filter-group">
            <label>Min Deposit:</label>
            <select 
              value={selectedFilter.minDeposit} 
              onChange={(e) => handleFilterChange('minDeposit', e.target.value)}
            >
              <option value="all">Any</option>
              <option value="0">$0</option>
              <option value="50">$50 or less</option>
              <option value="100">$100 or less</option>
              <option value="200">$200 or less</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Min Leverage:</label>
            <select 
              value={selectedFilter.leverage} 
              onChange={(e) => handleFilterChange('leverage', e.target.value)}
            >
              <option value="all">Any</option>
              <option value="1:30">1:30+</option>
              <option value="1:100">1:100+</option>
              <option value="1:500">1:500+</option>
              <option value="1:1000">1:1000+</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Regulation:</label>
            <select 
              value={selectedFilter.regulated} 
              onChange={(e) => handleFilterChange('regulated', e.target.value)}
            >
              <option value="all">Any</option>
              <option value="true">Regulated</option>
              <option value="false">Unregulated</option>
            </select>
          </div>
        </div>
      </div>
      
      {brokers.length === 0 ? (
        <div className="no-results">
          <p>No brokers match your search criteria</p>
          <button 
            className="reset-filters" 
            onClick={() => {
              setSearchQuery("");
              setSelectedFilter({
                minDeposit: "all",
                leverage: "all",
                regulated: "all"
              });
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="brokers-table-container">
          <table className="brokers-table">
            <thead>
              <tr>
                <th className="rank-col">#</th>
                <th 
                  className="broker-col"
                  onClick={() => requestSort('name')}
                >
                  Broker {getSortIndicator('name')}
                </th>
                <th 
                  className="leverage-col"
                  onClick={() => requestSort('leverage')}
                >
                  Leverage {getSortIndicator('leverage')}
                </th>
                <th 
                  className="deposit-col"
                  onClick={() => requestSort('minDeposit')}
                >
                  Min Deposit {getSortIndicator('minDeposit')}
                </th>
                <th 
                  className="rating-col"
                  onClick={() => requestSort('rating')}
                >
                  Rating {getSortIndicator('rating')}
                </th>
                <th className="action-col">Action</th>
              </tr>
            </thead>
            <tbody>
              {brokers.map((broker, index) => (
                <React.Fragment key={broker.id}>
                  <tr 
                    className={expandedBroker === broker.id ? "broker-row expanded" : "broker-row"}
                    onClick={() => handleBrokerClick(broker.id)}
                  >
                    <td className="rank-col">{index + 1}</td>
                    <td className="broker-name">
                      <img 
                        src={broker.logo} 
                        alt={`${broker.name} logo`} 
                        className="broker-logo"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/120x60?text=Broker";
                        }}
                      />
                      <span>{broker.name}</span>
                    </td>
                    <td className="leverage-col">{broker.leverage}</td>
                    <td className="deposit-col">{broker.minDeposit}</td>
                    <td className="rating-col">
                      {renderStarRating(broker.rating)}
                    </td>
                    <td className="action-col">
                      <a 
                        href={broker.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="open-account-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open Account
                      </a>
                    </td>
                  </tr>
                  {expandedBroker === broker.id && (
                    <tr className="broker-details-row">
                      <td colSpan="6">
                        <div className="broker-details">
                          <div className="broker-details-section">
                            <h4>Trading Details</h4>
                            <div className="details-grid">
                              <div className="detail-item">
                                <span className="detail-label">Spread from:</span>
                                <span className="detail-value">{broker.spreadFrom}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Platforms:</span>
                                <span className="detail-value">{broker.tradingPlatforms.join(", ")}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Established:</span>
                                <span className="detail-value">{broker.established}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Regulation:</span>
                                <span className="detail-value">
                                  {broker.regulated ? broker.regulators.join(", ") : "Unregulated"}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="broker-features">
                            <h4>Popular For</h4>
                            <p>{broker.popularFor}</p>
                          </div>
                          
                          <div className="broker-cta">
                            <a 
                              href={broker.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="visit-website-btn"
                            >
                              Visit Website
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
      
      <div className="brokers-disclaimer">
        <p>
          <strong>Disclaimer:</strong> Trading CFDs and Forex involves significant risk and can result in the loss of your invested capital. 
          You should not invest more than you can afford to lose and should ensure that you fully understand the risks involved. 
          Trading leveraged products may not be suitable for all investors. Before trading, please take into consideration your level of 
          experience, investment objectives and seek independent financial advice if necessary.
        </p>
      </div>
    </div>
  );
};

export default TopBrokers;