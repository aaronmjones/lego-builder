import React, { useState } from "react";
import "./App.css";
import Tabs from './components/Tabs'
import TabContent from './components/TabContent'
import UserStatus from './components/UserStatus'
import useUser from './hooks/useUser'; // <-- import the hook

const App = () => {
  const user = useUser(); // <-- use the hook
  const [activeTab, setActiveTab] = useState("Add Set");

  const tabs = ["Add Set", "My Sets", "Lookup Piece", "Wishlist"];

  return (
    <div className="app">
      <UserStatus user={user} /> {/* pass user as prop */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="tab-content">
        <TabContent activeTab={activeTab} user={user} /> {/* pass user as prop if needed */}
      </div>
    </div>
  );
};

export default App;
