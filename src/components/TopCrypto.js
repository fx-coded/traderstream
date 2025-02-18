import React from "react";
import "../styles/TopCrypto.css"; // ✅ Import CSS for styling

const exchanges = [
  {
    name: "Binance",
    logo: "/images/binance.png",
    tradingPairs: "600+",
    volume: "$50B",
    trustpilot: "4.8",
    link: "https://www.binance.com/",
  },
  {
    name: "Coinbase",
    logo: "/images/coinbase.png",
    tradingPairs: "200+",
    volume: "$3B",
    trustpilot: "4.7",
    link: "https://www.coinbase.com/",
  },
  {
    name: "Kraken",
    logo: "/images/kraken.png",
    tradingPairs: "150+",
    volume: "$1.5B",
    trustpilot: "4.6",
    link: "https://www.kraken.com/",
  },
  {
    name: "Bybit",
    logo: "/images/bybit.png",
    tradingPairs: "300+",
    volume: "$6B",
    trustpilot: "4.5",
    link: "https://www.bybit.com/",
  },
  {
    name: "OKX",
    logo: "/images/okx.png",
    tradingPairs: "400+",
    volume: "$10B",
    trustpilot: "4.5",
    link: "https://www.okx.com/",
  },
  {
    name: "Bitfinex",
    logo: "/images/bitfinex.png",
    tradingPairs: "120+",
    volume: "$1B",
    trustpilot: "4.4",
    link: "https://www.bitfinex.com/",
  },
  {
    name: "Huobi",
    logo: "/images/huobi.png",
    tradingPairs: "500+",
    volume: "$8B",
    trustpilot: "4.4",
    link: "https://www.huobi.com/",
  },
  {
    name: "KuCoin",
    logo: "/images/kucoin.png",
    tradingPairs: "700+",
    volume: "$5B",
    trustpilot: "4.3",
    link: "https://www.kucoin.com/",
  },
  {
    name: "Gate.io",
    logo: "/images/gateio.png",
    tradingPairs: "1000+",
    volume: "$2B",
    trustpilot: "4.3",
    link: "https://www.gate.io/",
  },
  {
    name: "Bitstamp",
    logo: "/images/bitstamp.png",
    tradingPairs: "80+",
    volume: "$700M",
    trustpilot: "4.2",
    link: "https://www.bitstamp.net/",
  },
];

const TopCryptoExchanges = () => {
  return (
    <div className="crypto-exchanges-container">
      {/* <h2 className="crypto-exchanges-title">Top Crypto Exchanges</h2> */}

      <div className="crypto-exchanges-table-container">
        <table className="crypto-exchanges-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Exchange</th>
              <th>Trading Pairs</th>
              <th>24H Volume</th>
              <th>Trustpilot</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {exchanges.map((exchange, index) => (
              <tr key={exchange.name}>
                <td>{index + 1}</td>
                <td className="exchange-name">
                  <img
                    src={exchange.logo}
                    alt={exchange.name}
                    className="exchange-logo"
                  />
                  {exchange.name}
                </td>
                <td>{exchange.tradingPairs}</td>
                <td>{exchange.volume}</td>
                <td>⭐ {exchange.trustpilot}</td>
                <td>
                  <a
                    href={exchange.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="open-account-btn"
                  >
                    Visit Exchange
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

export default TopCryptoExchanges;
