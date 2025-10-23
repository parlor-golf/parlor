import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDZAt3J7EBhObYOuxgT8rR0VI_z88dGrGM",
  authDomain: "parlor-1752e.firebaseapp.com",
  projectId: "parlor-1752e",
  storageBucket: "parlor-1752e.firebasestorage.app",
  messagingSenderId: "951195595957",
  appId: "1:951195595957:web:bf22610ed7f0991d0f3afc",
  measurementId: "G-M8QF1GWMED"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);