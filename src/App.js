import React, { useState } from "react";
import "./App.css";
import Tabs from './components/Tabs'
import TabContent from './components/TabContent'
import UserStatus from './components/UserStatus'

const App = () => {
  const [activeTab, setActiveTab] = useState("Add Set");

  const tabs = ["Add Set", "View Set", "Lookup Piece", "Wishlist"];

  return (
    <div className="app">
      <UserStatus />
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="tab-content">
        <TabContent activeTab={activeTab} />
      </div>
    </div>
  );
};

export default App;
