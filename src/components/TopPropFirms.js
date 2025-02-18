import React from "react";
import "../styles/TopPropFirms.css"; // ✅ Import updated CSS

const propFirms = [
  { 
    name: "FTMO", 
    logo: "/images/ftmo.png", 
    leverage: "1:100", 
    minAccountSize: "$10,000", 
    profitSplit: "80/20", 
    rating: "4.9", 
    link: "https://ftmo.com/"
  },
  { 
    name: "My Forex Funds", 
    logo: "/images/myforexfunds.png", 
    leverage: "1:100", 
    minAccountSize: "$5,000", 
    profitSplit: "85/15", 
    rating: "4.8", 
    link: "https://myforexfunds.com/"
  },
  { 
    name: "E8 Funding", 
    logo: "/images/e8.png", 
    leverage: "1:50", 
    minAccountSize: "$25,000", 
    profitSplit: "80/20", 
    rating: "4.7", 
    link: "https://e8funding.com/"
  },
  { 
    name: "The Funded Trader", 
    logo: "/images/fundedtrader.png", 
    leverage: "1:100", 
    minAccountSize: "$10,000", 
    profitSplit: "90/10", 
    rating: "4.6", 
    link: "https://thefundedtraderprogram.com/"
  },
  { 
    name: "True Forex Funds", 
    logo: "/images/trueforexfunds.png", 
    leverage: "1:100", 
    minAccountSize: "$10,000", 
    profitSplit: "80/20", 
    rating: "4.5", 
    link: "https://trueforexfunds.com/"
  }
];

const TopPropFirms = () => {
  return (
    <div className="prop-firms-container">
      {/* <h2 className="prop-firms-title">Top Prop Firms</h2> */}

      <div className="prop-firms-table-container">
        <table className="prop-firms-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Prop Firm</th>
              <th>Leverage</th>
              <th>Min Account Size</th>
              <th>Profit Split</th>
              <th>Trustpilot</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {propFirms.map((firm, index) => (
              <tr key={firm.name}>
                <td>{index + 1}</td>
                <td className="firm-name">
                  <img
                    src={firm.logo}
                    alt={firm.name}
                    className="firm-logo"
                  />
                  {firm.name}
                </td>
                <td>{firm.leverage}</td>
                <td>{firm.minAccountSize}</td>
                <td>{firm.profitSplit}</td>
                <td>⭐ {firm.rating}</td>
                <td>
                  <a
                    href={firm.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="open-account-btn"
                  >
                    Open Account
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopPropFirms;
