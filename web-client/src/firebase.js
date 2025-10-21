import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // ✅ Add this import

const firebaseConfig = {
  apiKey: "AIzaSyAMqdQMw5xNo_JyVP453x13_gGcxvPZdnc",
  authDomain: "tiger-mango-inventory.firebaseapp.com",
  projectId: "tiger-mango-inventory",
  storageBucket: "tiger-mango-inventory.appspot.com",
  messagingSenderId: "468721196593",
  appId: "1:468721196593:web:7fb67ce445f4fe639fbf10",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app); // ✅ Initialize and export auth