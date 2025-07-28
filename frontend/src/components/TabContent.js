import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import AddSet from './AddSet'; // adjust import path
import MySets from './MySets';
import PieceSearch from './PieceSearch';

const TabContent = ({ activeTab }) => {
  const [user, setUser] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  if (!user) {
    return <div>Please login</div>;
  }

  switch (activeTab) {
    case "Add Set":
      return <AddSet onSetAdded={(id) => console.log("Added set ID:", id)} />;
    case "My Sets":
      return <MySets />;
    case "Piece Search":
      return <PieceSearch />;
    case "Wishlist":
      return <div>Your wishlist items.</div>;
    default:
      return <div>Select a tab.</div>;
  }
};

export default TabContent;
