// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB9LcKWy8HvD_0qEZCxEhLfSp-ws84HhsE",
  authDomain: "re4b-app.firebaseapp.com",
  projectId: "re4b-app",
  storageBucket: "re4b-app.firebasestorage.app",
  messagingSenderId: "677972300754",
  appId: "1:677972300754:web:c43da5867abaf86bd62e0b",
  measurementId: "G-22V356ZY32"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export services for use in the app
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export { analytics };