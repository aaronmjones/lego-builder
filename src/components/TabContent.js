import React from "react";

const TabContent = ({ activeTab }) => {
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

export default TabContent;
