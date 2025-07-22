import React from "react";
import AddSet from "./AddSet"

const TabContent = ({ activeTab }) => {
  switch (activeTab) {
    case "Add Set":
      return <AddSet onSetAdded={(id) => console.log("Added set ID:", id)} />;
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

export default TabContent;
