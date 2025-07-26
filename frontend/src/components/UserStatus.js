import React, { useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const UserStatus = ({ user }) => {
  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      // Removed local user state and using the prop instead
    });
  }, []);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        console.log("Sign-in popup closed by user before completion.");
        // Optionally, display a gentle message or ignore silently
      } else {
        console.error("Sign-in failed:", error);
      }
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <div style={{ position: "absolute", top: 20, right: 20 }}>
      {user ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "#f5f5f5",
            padding: "8px 12px",
            borderRadius: "8px",
          }}
        >
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName}
              style={{ width: "40px", height: "40px", borderRadius: "50%" }}
            />
          )}
          <span style={{ fontWeight: "bold" }}>Welcome, {user.displayName}</span>
          <button onClick={handleSignOut}>Log out</button>
        </div>
      ) : (
        <button onClick={handleSignIn}>Sign in with Google</button>
      )}
    </div>
  );
};

export default UserStatus;
