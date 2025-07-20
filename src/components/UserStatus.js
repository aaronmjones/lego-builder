import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const UserStatus = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
  }, []);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <div style={{ position: "absolute", top: 20, right: 20 }}>
      {user ? (
        <div>
          <span>Welcome, {user.displayName}</span>
          <button onClick={handleSignOut}>Log out</button>
        </div>
      ) : (
        <button onClick={handleSignIn}>Sign in</button>
      )}
    </div>
  );
};

export default UserStatus;
