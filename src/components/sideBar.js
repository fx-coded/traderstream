import React, { useState } from "react";
import { FaChartLine, FaBitcoin, FaFire, FaOilCan} from "react-icons/fa";
import { HiTrendingUp } from "react-icons/hi";
import { IoMdClose } from "react-icons/io";
import "../styles/global.css";

const Sidebar = ({ popularChannels = [], setFilteredCategories, activeTab }) => {
  const categories = [
    { name: "Forex Trading", icon: <FaChartLine /> },
    { name: "Crypto Trading", icon: <FaBitcoin /> },
    { name: "Futures & Commodities", icon: <FaFire /> },
    { name: "Meme Coin Degens", icon: <HiTrendingUp /> },
    { name: "Gold, Oil & Indices", icon: <FaOilCan /> },
  ];

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showChannels, setShowChannels] = useState(true); // Toggle for Popular Channels

  const handleCategoryClick = (category) => {
    const newCategory = selectedCategory === category ? null : category;
    setSelectedCategory(newCategory);
    setFilteredCategories && setFilteredCategories(newCategory);
  };

  return (
    <aside className="sidebar">
      {/* 📊 Categories */}
      <h3 className="sidebar-title">📊 Categories</h3>
      <ul className="sidebar-list">
        {categories.map((category, index) => (
          <li
            key={index}
            className={`sidebar-item ${selectedCategory === category.name ? "selected" : ""}`}
            onClick={() => handleCategoryClick(category.name)}
          >
            {category.icon} {category.name}
          </li>
        ))}
      </ul>

      {/* ✖ Clear Filters */}
      {selectedCategory && (
        <button className="clear-filter-btn" onClick={() => handleCategoryClick(null)}>
          <IoMdClose size={18} /> Clear Filters
        </button>
      )}

      {/* 🔥 Popular Channels (Only for Streams) */}
      {activeTab === "Streams" && (
        <div className="popular-channels-section">
          <h3 className="sidebar-title" onClick={() => setShowChannels(!showChannels)}>
            🔥 Popular Channels {showChannels ? "▼" : "▶"}
          </h3>
          {showChannels && (
            <ul className="sidebar-list">
              {popularChannels.length > 0 ? (
                popularChannels.map((channel, index) => (
                  <li key={index} className="sidebar-item">{channel}</li>
                ))
              ) : (
                <p className="no-channels">Be the first to go live!</p>
              )}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
