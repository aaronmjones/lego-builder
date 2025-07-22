// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAik_ONaSI6n0NUuu1uAA-qvIFJC3yD1kk",
  authDomain: "lego-builder-cbb9b.firebaseapp.com",
  projectId: "lego-builder-cbb9b",
  storageBucket: "lego-builder-cbb9b.firebasestorage.app",
  messagingSenderId: "647363250845",
  appId: "1:647363250845:web:0ecd0f54b5ed85725ca274",
  measurementId: "G-1DET06KCC6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);