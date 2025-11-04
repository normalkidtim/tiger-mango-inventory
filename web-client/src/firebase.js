// web-client/src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // ✅ Add this import

// 👇 ***** UPDATE THESE VALUES ***** 👇
const firebaseConfig = {
  apiKey: "AIzaSyAMqdQMw5xNo_JyVP453x13_gGcxvPZdnc", // Keep this if it's the same for both projects
  authDomain: "tiger-mango.firebaseapp.com",       // Use the correct Auth Domain
  projectId: "tiger-mango",                         // Use the correct Project ID
  storageBucket: "tiger-mango.appspot.com",         // Use the correct Storage Bucket (check Firebase console if unsure)
  messagingSenderId: "468721196593",              // Keep this if it's the same
  appId: "1:468721196593:web:7fb67ce445f4fe639fbf10" // Keep this if it's the same web app ID
};
// 👆 ***** UPDATE THESE VALUES ***** 👆

// --- UPDATED BLOCK ---

// Main app instance for your app
const app = initializeApp(firebaseConfig);

// NEW: Secondary app instance specifically for admin-only actions
// We give it a unique name to avoid conflicts.
const adminApp = initializeApp(firebaseConfig, "adminCreateUserApp");

export const db = getFirestore(app);
export const auth = getAuth(app); // Main auth for login, logout, state
export const adminAuth = getAuth(adminApp); // Secondary auth for creating users

// --- END UPDATED BLOCK ---