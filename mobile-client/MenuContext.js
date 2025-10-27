// mobile-client/MenuContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Alert } from 'react-native';

const MenuContext = createContext();

export function useMenu() {
  return useContext(MenuContext);
}

export function MenuProvider({ children }) {
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to the single document where menu data is stored
    const menuDocRef = doc(db, 'config', 'menu');
    
    const unsubscribe = onSnapshot(menuDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMenu(data);
      } else {
        // Fallback for a missing document
        Alert.alert("Error", "Menu configuration not found in database. Please check Firestore 'config/menu'.");
        setMenu({ categories: [], addons: [] });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching menu:", error);
      Alert.alert("Error", "Failed to fetch menu data. Check connection or Firestore rules.");
      setMenu({ categories: [], addons: [] });
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <MenuContext.Provider value={{ menu, menuLoading: loading }}>
      {children}
    </MenuContext.Provider>
  );
}