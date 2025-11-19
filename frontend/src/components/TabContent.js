import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import AddSet from './AddSet'; // adjust import path
import MySets from './MySets';
import PieceSearch from './PieceSearch';

const TabContent = ({ activeTab }) => {
  const [user, setUser] = useState(null);
  const auth = getAuth();

  // new refresh key
  const [mySetsRefreshKey, setMySetsRefreshKey] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  const handleSetAdded = (id) => {
    console.log("Added set ID:", id);
    setMySetsRefreshKey(k => k + 1); // trigger refresh for MySets
  };

  if (!user) {
    return <div>Please login</div>;
  }

  switch (activeTab) {
    case "My Sets":
      return (
        <div>
          <AddSet onSetAdded={handleSetAdded} />
          <MySets refreshKey={mySetsRefreshKey} />
        </div>
      );
    case "Piece Search":
      return <PieceSearch />;
    case "Wishlist":
      return <div>Your wishlist items.</div>;
    default:
      return <div>Select a tab.</div>;
  }
};

export default TabContent;
