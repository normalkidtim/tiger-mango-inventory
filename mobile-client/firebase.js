import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// ✅ Import the required persistence tools
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; // Re-import AsyncStorage

const firebaseConfig = {
  apiKey: "AIzaSyAMqdQMw5xNo_JyVP453x13_gGcxvPZdnc",
  authDomain: "tiger-mango.firebaseapp.com",
  projectId: "tiger-mango",
  storageBucket: "tiger-mango.firebasestorage.app",
  messagingSenderId: "468721196593",
  appId: "1:468721196593:web:7fb67ce445f4fe639fbf10"
};

const app = initializeApp(firebaseConfig);

// ✅ CHANGE: Initialize Auth with getReactNativePersistence to make the login persistent
initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);