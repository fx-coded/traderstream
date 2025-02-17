import React, { useState } from "react";
import { FaChartLine, FaBitcoin, FaFire, FaOilCan } from "react-icons/fa";
import { HiTrendingUp } from "react-icons/hi";
import "../styles/sideBar.css";

const categories = [
  { name: "Forex Trading", icon: <FaChartLine /> },
  { name: "Crypto Trading", icon: <FaBitcoin /> },
  { name: "Futures & Commodities", icon: <FaFire /> },
  { name: "Meme Coin Degens", icon: <HiTrendingUp /> },
  { name: "Gold, Oil & Indices", icon: <FaOilCan /> },
];

const TopNavigation = ({ setFilteredCategories }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategoryClick = (category) => {
    const newCategory = selectedCategory === category ? null : category;
    setSelectedCategory(newCategory);
    setFilteredCategories && setFilteredCategories(newCategory);
  };

  return (
    <div className="top-navigation">
      {categories.map((category, index) => (
        <button
          key={index}
          className={`category-button ${selectedCategory === category.name ? "selected" : ""}`}
          onClick={() => handleCategoryClick(category.name)}
        >
          {category.icon} {category.name}
        </button>
      ))}
    </div>
  );
};

export default TopNavigation;
