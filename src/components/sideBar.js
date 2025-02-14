import React, { useState } from "react";
import "../styles/global.css";

const Sidebar = ({ popularChannels = [], setFilteredCategories, activeTab }) => {
  const categories = [
    "Forex Trading",
    "Crypto Trading",
    "Futures & Commodities",
    "Meme Coin Degens",
    "Gold, Oil & Indices",
  ];

  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategoryClick = (category) => {
    const newCategory = selectedCategory === category ? null : category;
    setSelectedCategory(newCategory);
    setFilteredCategories && setFilteredCategories(newCategory); // Update filters
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setFilteredCategories && setFilteredCategories(null); // Reset filters
  };

  return (
    <aside className="sidebar">
      {/* 📊 Categories */}
      <h3 className="sidebar-title">📊 Categories</h3>
      <ul className="sidebar-list">
        {categories.map((category, index) => (
          <li
            key={index}
            className={`sidebar-item ${selectedCategory === category ? "selected" : ""}`}
            onClick={() => handleCategoryClick(category)}
          >
            {category}
          </li>
        ))}
      </ul>

      {selectedCategory && (
        <button className="clear-filter-btn" onClick={clearFilters}>
          ✖ Clear Filters
        </button>
      )}

      {/* 🔥 Popular Channels (Only for Streams) */}
      {activeTab === "Streams" && (
        <>
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
        </>
      )}
    </aside>
  );
};

export default Sidebar;
