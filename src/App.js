import React, { useState } from "react";
import "./App.css";

const App = () => {
  const [activeTab, setActiveTab] = useState("Add Set");

  const renderContent = () => {
    switch (activeTab) {
      case "Add Set":
        return <div>Add your set here.</div>;
      case "View Set":
        return <div>Here are your sets.</div>;
      case "Lookup Piece":
        return <div>Search for a piece.</div>;
      case "Wishlist":
        return <div>Your wishlist items.</div>;
      default:
        return <div>Select a tab.</div>;
    }
  };

  const tabs = ["Add Set", "View Set", "Lookup Piece", "Wishlist"];

  return (
    <div className="app">
      <nav className="tab-nav">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
      <div className="tab-content">{renderContent()}</div>
    </div>
  );
};

export default App;
