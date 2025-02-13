import React, { useState } from "react";
import "../styles/global.css";

const Sidebar = ({ popularChannels = [], setFilteredCategories }) => {
  const categories = [
    "Forex Trading",
    "Crypto Trading",
    "Futures & Commodities",
    "Meme Coin Degens",
    "Gold, Oil & Indices",
  ];

  const [selectedCategories, setSelectedCategories] = useState([]);

  const toggleCategory = (category) => {
    let updatedCategories;
    if (selectedCategories.includes(category)) {
      updatedCategories = selectedCategories.filter((cat) => cat !== category);
    } else {
      updatedCategories = [...selectedCategories, category];
    }

    setSelectedCategories(updatedCategories);
    setFilteredCategories && setFilteredCategories(updatedCategories); // Prevents crashes
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setFilteredCategories && setFilteredCategories([]); // Clears filters
  };

  return (
    <aside className="sidebar">
      {/* 📊 Categories */}
      <h3 className="sidebar-title">📊 Categories</h3>
      <ul className="sidebar-list">
        {categories.map((category, index) => (
          <li
            key={index}
            className={`sidebar-item ${selectedCategories.includes(category) ? "selected" : ""}`}
            onClick={() => toggleCategory(category)}
          >
            {category}
          </li>
        ))}
      </ul>

      {selectedCategories.length > 0 && (
        <button className="clear-filter-btn" onClick={clearFilters}>
          ✖ Clear Filters
        </button>
      )}

      {/* 🔥 Popular Channels */}
      <h3 className="sidebar-title popular">🔥 Popular Channels</h3>
      {popularChannels.length > 0 ? (
        <ul className="sidebar-list">
          {popularChannels.map((channel, index) => (
            <li key={index} className="sidebar-item">{channel}</li>
          ))}
        </ul>
      ) : (
        <p className="no-channels">Be the first to go live!</p>
      )}
    </aside>
  );
};

export default Sidebar;
