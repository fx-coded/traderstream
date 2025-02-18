import React from "react";
import "../styles/TopBrokers.css";

const brokers = [
  { 
    name: "IC Markets", 
    logo: "/images/ic-markets.png", 
    leverage: "1:500", 
    minDeposit: "$200", 
    rating: "4.9", 
    link: "https://www.icmarkets.com/"
  },
  { 
    name: "Pepperstone", 
    logo: "/images/pepperstone.png", 
    leverage: "1:500", 
    minDeposit: "$200", 
    rating: "4.8", 
    link: "https://www.pepperstone.com/"
  },
  { 
    name: "OANDA", 
    logo: "/images/oanda.png", 
    leverage: "1:100", 
    minDeposit: "$0", 
    rating: "4.7", 
    link: "https://www.oanda.com/"
  },
  { 
    name: "XM", 
    logo: "/images/xm.png", 
    leverage: "1:888", 
    minDeposit: "$5", 
    rating: "4.6", 
    link: "https://www.xm.com/"
  },
  { 
    name: "FP Markets", 
    logo: "/images/fp-markets.png", 
    leverage: "1:500", 
    minDeposit: "$100", 
    rating: "4.6", 
    link: "https://www.fpmarkets.com/"
  },
  { 
    name: "Forex.com", 
    logo: "/images/forexcom.png", 
    leverage: "1:200", 
    minDeposit: "$100", 
    rating: "4.5", 
    link: "https://www.forex.com/"
  },
  { 
    name: "FXTM", 
    logo: "/images/fxtm.png", 
    leverage: "1:2000", 
    minDeposit: "$10", 
    rating: "4.4", 
    link: "https://www.forextime.com/"
  },
  { 
    name: "Admirals", 
    logo: "/images/admirals.png", 
    leverage: "1:500", 
    minDeposit: "$100", 
    rating: "4.4", 
    link: "https://admirals.com/"
  },
  { 
    name: "AxiTrader", 
    logo: "/images/axitrader.png", 
    leverage: "1:400", 
    minDeposit: "$0", 
    rating: "4.3", 
    link: "https://www.axitrader.com/"
  },
  { 
    name: "Eightcap", 
    logo: "/images/eightcap.png", 
    leverage: "1:500", 
    minDeposit: "$100", 
    rating: "4.3", 
    link: "https://www.eightcap.com/"
  }
];

const TopBrokers = () => {
  return (
    <div className="brokers-container">
      {/* <h2 className="brokers-title"></h2> */}
      <div className="brokers-table-container">
        <table className="brokers-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Broker</th>
              <th>Leverage</th>
              <th>Min Deposit</th>
              <th>Trustpilot</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {brokers.map((broker, index) => (
              <tr key={broker.name}>
                <td>{index + 1}</td>
                <td className="broker-name">
                  <img 
                    src={broker.logo} 
                    alt={broker.name} 
                    className="broker-logo"
                  />
                  <span>{broker.name}</span>
                </td>
                <td>{broker.leverage}</td>
                <td>{broker.minDeposit}</td>
                <td>⭐ {broker.rating}</td>
                <td>
                  <a 
                    href={broker.link} 
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

export default TopBrokers;
