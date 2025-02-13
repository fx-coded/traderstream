import React from "react";
import "../styles/global.css";

const TopCountries = () => {
  const countries = [
    { id: 1, name: "United States", volume: "$2.5B", rank: 1 },
    { id: 2, name: "United Kingdom", volume: "$1.8B", rank: 2 },
    { id: 3, name: "Japan", volume: "$1.5B", rank: 3 },
    { id: 4, name: "Germany", volume: "$1.3B", rank: 4 },
    { id: 5, name: "Australia", volume: "$1.1B", rank: 5 },
  ];

  return (
    <section className="top-countries">
      <h2>🌍 Top Trading Countries</h2>
      <ul className="country-list">
        {countries.map((country) => (
          <li key={country.id} className="country-card">
            <span className="rank">#{country.rank}</span>
            <span className="name">{country.name}</span>
            <span className="volume">💰 {country.volume}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default TopCountries;
