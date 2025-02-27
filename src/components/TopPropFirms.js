import React, { useState, useEffect } from "react";
import "../styles/TopPropFirms.css";

// Import prop firm logos properly
import ftmoLogo from "./images/ftmo.png";
import e8Logo from "./images/ftmo.png";
import fundedTraderLogo from "./images/ftmo.png";
import trueForexFundsLogo from "./images/ftmo.png";
import cityTradersLogo from "./images/ftmo.png";
import fundedNextLogo from "./images/ftmo.png";
import topstepLogo from "./images/ftmo.png";

// Enhanced prop firms data with more details
const propFirmsData = [
  { 
    id: 1,
    name: "FTMO", 
    logo: ftmoLogo, 
    leverage: "1:100", 
    minAccountSize: "$10,000", 
    profitSplit: "80/20", 
    rating: "4.9",
    challengeFee: "$155",
    challengePhases: 2,
    timeToComplete: "30 days per phase",
    tradingPlatforms: ["MT4", "MT5", "cTrader"],
    assets: ["Forex", "Indices", "Commodities", "Stocks", "Crypto"],
    profitTarget: "10% Phase 1, 5% Phase 2",
    maxDrawdown: "5% daily, 10% total",
    popularFor: "Established reputation & reliable payouts",
    link: "https://ftmo.com/"
  },
  { 
    id: 2,
    name: "E8 Funding", 
    logo: e8Logo, 
    leverage: "1:50", 
    minAccountSize: "$25,000", 
    profitSplit: "80/20", 
    rating: "4.7",
    challengeFee: "$250",
    challengePhases: 1,
    timeToComplete: "Unlimited",
    tradingPlatforms: ["MT4", "MT5"],
    assets: ["Forex", "Indices", "Commodities", "Crypto"],
    profitTarget: "None",
    maxDrawdown: "5% daily, 8% total",
    popularFor: "Single phase challenge & no profit targets",
    link: "https://e8funding.com/"
  },
  { 
    id: 3,
    name: "The Funded Trader", 
    logo: fundedTraderLogo, 
    leverage: "1:100", 
    minAccountSize: "$10,000", 
    profitSplit: "90/10", 
    rating: "4.6",
    challengeFee: "$125",
    challengePhases: 2,
    timeToComplete: "No time limit",
    tradingPlatforms: ["MT4", "MT5"],
    assets: ["Forex", "Indices", "Commodities", "Crypto"],
    profitTarget: "8% Phase 1, 5% Phase 2",
    maxDrawdown: "5% daily, 10% total",
    popularFor: "Highest profit splits in the industry",
    link: "https://thefundedtraderprogram.com/"
  },
  { 
    id: 4,
    name: "True Forex Funds", 
    logo: trueForexFundsLogo, 
    leverage: "1:100", 
    minAccountSize: "$10,000", 
    profitSplit: "80/20", 
    rating: "4.5",
    challengeFee: "$149",
    challengePhases: 2,
    timeToComplete: "30 days per phase",
    tradingPlatforms: ["MT4", "MT5"],
    assets: ["Forex", "Indices", "Commodities", "Metals"],
    profitTarget: "8% Phase 1, 5% Phase 2",
    maxDrawdown: "5% daily, 12% total",
    popularFor: "No consistency rules & weekend holding",
    link: "https://trueforexfunds.com/"
  },
  { 
    id: 5,
    name: "City Traders Imperium", 
    logo: cityTradersLogo, 
    leverage: "1:100", 
    minAccountSize: "$25,000", 
    profitSplit: "70/30", 
    rating: "4.6",
    challengeFee: "$180",
    challengePhases: 2,
    timeToComplete: "No time limit",
    tradingPlatforms: ["MT4", "MT5"],
    assets: ["Forex", "Indices", "Commodities"],
    profitTarget: "10% total",
    maxDrawdown: "5% daily, 10% total",
    popularFor: "No minimum trading days & relaxed rules",
    link: "https://citytraders.com/"
  },
  { 
    id: 6,
    name: "Funded Next", 
    logo: fundedNextLogo, 
    leverage: "1:100", 
    minAccountSize: "$15,000", 
    profitSplit: "80/20", 
    rating: "4.4",
    challengeFee: "$129",
    challengePhases: 2,
    timeToComplete: "No time limit",
    tradingPlatforms: ["MT4", "MT5"],
    assets: ["Forex", "Indices", "Commodities", "Crypto"],
    profitTarget: "8% Phase 1, 5% Phase 2",
    maxDrawdown: "5% daily, 10% total",
    popularFor: "Instant funding option available",
    link: "https://fundednext.com/"
  },
  { 
    id: 7,
    name: "Topstep", 
    logo: topstepLogo, 
    leverage: "1:100", 
    minAccountSize: "$50,000", 
    profitSplit: "80/20", 
    rating: "4.3",
    challengeFee: "$165",
    challengePhases: 2,
    timeToComplete: "No time limit",
    tradingPlatforms: ["NinjaTrader", "TradingView"],
    assets: ["Futures"],
    profitTarget: "None",
    maxDrawdown: "$2,000 for $50k account",
    popularFor: "Specialized in futures trading",
    link: "https://www.topstep.com/"
  }
];

const TopPropFirms = () => {
  const [propFirms, setPropFirms] = useState(propFirmsData);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [expandedFirm, setExpandedFirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState({
    minAccountSize: "all",
    profitSplit: "all"
  });

  // Sort and filter prop firms
  useEffect(() => {
    let sortedFirms = [...propFirmsData];
    
    if (sortConfig.key) {
      sortedFirms.sort((a, b) => {
        // Handle rating sorting as numbers
        if (sortConfig.key === 'rating') {
          return sortConfig.direction === 'ascending' 
            ? parseFloat(a.rating) - parseFloat(b.rating)
            : parseFloat(b.rating) - parseFloat(a.rating);
        }
        
        // Handle min account size sorting
        if (sortConfig.key === 'minAccountSize') {
          const accountA = parseInt(a.minAccountSize.replace(/[^0-9]/g, ''));
          const accountB = parseInt(b.minAccountSize.replace(/[^0-9]/g, ''));
          return sortConfig.direction === 'ascending' 
            ? accountA - accountB
            : accountB - accountA;
        }
        
        // Handle profit split sorting
        if (sortConfig.key === 'profitSplit') {
          const splitA = parseInt(a.profitSplit.split('/')[0]);
          const splitB = parseInt(b.profitSplit.split('/')[0]);
          return sortConfig.direction === 'ascending' 
            ? splitA - splitB
            : splitB - splitA;
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
    
    // Apply min account size filter
    if (selectedFilter.minAccountSize !== "all") {
      const maxSize = parseInt(selectedFilter.minAccountSize);
      sortedFirms = sortedFirms.filter(firm => {
        const size = parseInt(firm.minAccountSize.replace(/[^0-9]/g, ''));
        return size <= maxSize;
      });
    }
    
    // Apply profit split filter
    if (selectedFilter.profitSplit !== "all") {
      const minSplit = parseInt(selectedFilter.profitSplit);
      sortedFirms = sortedFirms.filter(firm => {
        const split = parseInt(firm.profitSplit.split('/')[0]);
        return split >= minSplit;
      });
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      sortedFirms = sortedFirms.filter(firm => 
        firm.name.toLowerCase().includes(query) || 
        firm.popularFor.toLowerCase().includes(query) ||
        firm.assets.some(asset => asset.toLowerCase().includes(query)) ||
        firm.tradingPlatforms.some(platform => platform.toLowerCase().includes(query))
      );
    }
    
    setPropFirms(sortedFirms);
  }, [sortConfig, searchQuery, selectedFilter]);

  // Request sort on column click
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

  // Handle firm row click to expand/collapse details
  const handleFirmClick = (firmId) => {
    setExpandedFirm(expandedFirm === firmId ? null : firmId);
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setSelectedFilter(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Render star rating display
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
    <div className="prop-firms-container">
      <div className="prop-firms-header">
        <h2 className="prop-firms-title">Top Proprietary Trading Firms</h2>
        <p className="prop-firms-subtitle">Compare the best prop firms to get funded as a trader</p>
      </div>
      
      <div className="prop-firms-actions">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search prop firms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="prop-firm-search"
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
            <label>Max Account Size:</label>
            <select 
              value={selectedFilter.minAccountSize} 
              onChange={(e) => handleFilterChange('minAccountSize', e.target.value)}
            >
              <option value="all">Any Size</option>
              <option value="10000">$10,000 or less</option>
              <option value="25000">$25,000 or less</option>
              <option value="50000">$50,000 or less</option>
              <option value="100000">$100,000 or less</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Min Profit Split:</label>
            <select 
              value={selectedFilter.profitSplit} 
              onChange={(e) => handleFilterChange('profitSplit', e.target.value)}
            >
              <option value="all">Any Split</option>
              <option value="70">70% or higher</option>
              <option value="75">75% or higher</option>
              <option value="80">80% or higher</option>
              <option value="85">85% or higher</option>
              <option value="90">90% or higher</option>
            </select>
          </div>
        </div>
      </div>
      
      {propFirms.length === 0 ? (
        <div className="no-results">
          <p>No prop firms match your search criteria</p>
          <button 
            className="reset-filters" 
            onClick={() => {
              setSearchQuery("");
              setSelectedFilter({
                minAccountSize: "all",
                profitSplit: "all"
              });
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="prop-firms-table-container">
          <table className="prop-firms-table">
            <thead>
              <tr>
                <th>#</th>
                <th 
                  onClick={() => requestSort('name')}
                  className="sortable"
                >
                  Prop Firm {getSortIndicator('name')}
                </th>
                <th 
                  onClick={() => requestSort('leverage')}
                  className="sortable"
                >
                  Leverage {getSortIndicator('leverage')}
                </th>
                <th 
                  onClick={() => requestSort('minAccountSize')}
                  className="sortable"
                >
                  Min Account {getSortIndicator('minAccountSize')}
                </th>
                <th 
                  onClick={() => requestSort('profitSplit')}
                  className="sortable"
                >
                  Profit Split {getSortIndicator('profitSplit')}
                </th>
                <th 
                  onClick={() => requestSort('rating')}
                  className="sortable"
                >
                  Rating {getSortIndicator('rating')}
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {propFirms.map((firm, index) => (
                <React.Fragment key={firm.id}>
                  <tr 
                    className={expandedFirm === firm.id ? "firm-row expanded" : "firm-row"}
                    onClick={() => handleFirmClick(firm.id)}
                  >
                    <td>{index + 1}</td>
                    <td className="firm-name">
                      <img 
                        src={firm.logo} 
                        alt={`${firm.name} logo`} 
                        className="firm-logo"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/120x60?text=Prop+Firm";
                        }}
                      />
                      <span>{firm.name}</span>
                    </td>
                    <td>{firm.leverage}</td>
                    <td>{firm.minAccountSize}</td>
                    <td>{firm.profitSplit}</td>
                    <td>
                      {renderStarRating(firm.rating)}
                    </td>
                    <td>
                      <a 
                        href={firm.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="open-account-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Get Funded
                      </a>
                    </td>
                  </tr>
                  {expandedFirm === firm.id && (
                    <tr className="firm-details-row">
                      <td colSpan="7">
                        <div className="firm-details">
                          <div className="firm-details-section">
                            <h4>Challenge Details</h4>
                            <div className="details-grid">
                              <div className="detail-item">
                                <span className="detail-label">Challenge Fee:</span>
                                <span className="detail-value">{firm.challengeFee}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Phases:</span>
                                <span className="detail-value">{firm.challengePhases}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Time Limit:</span>
                                <span className="detail-value">{firm.timeToComplete}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Profit Target:</span>
                                <span className="detail-value">{firm.profitTarget}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Max Drawdown:</span>
                                <span className="detail-value">{firm.maxDrawdown}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="firm-details-section">
                            <h4>Trading Conditions</h4>
                            <div className="details-grid">
                              <div className="detail-item full-width">
                                <span className="detail-label">Trading Platforms:</span>
                                <span className="detail-value">{firm.tradingPlatforms.join(", ")}</span>
                              </div>
                              <div className="detail-item full-width">
                                <span className="detail-label">Available Assets:</span>
                                <span className="detail-value">{firm.assets.join(", ")}</span>
                              </div>
                              <div className="detail-item full-width">
                                <span className="detail-label">Popular For:</span>
                                <span className="detail-value">{firm.popularFor}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="firm-cta">
                            <a 
                              href={firm.link} 
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
      
      <div className="prop-firms-disclaimer">
        <p>
          <strong>Disclaimer:</strong> Trading with proprietary firms involves risk and requires skill. Most traders do not pass challenges. 
          Challenge fees are non-refundable at most firms. Always read the firm's terms and conditions before applying. 
          Past performance is not indicative of future results. This comparison is for informational purposes only.
        </p>
      </div>
    </div>
  );
};

export default TopPropFirms;