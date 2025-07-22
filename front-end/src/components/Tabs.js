import React from "react";
//import "./Tabs.css"; // optional: move tab-specific styles here

const Tabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <nav className="tab-nav">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={activeTab === tab ? "active" : ""}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
};

export default Tabs;
