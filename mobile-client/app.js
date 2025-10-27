import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

import './firebase'; // This initializes Firebase
import MainScreen from './MainScreen'; // NEW: Main Menu
import POSScreen from './POSScreen'; // Ordering System (now "Take Order")
import PendingOrdersScreen from './PendingOrdersScreen'; // NEW: Pending Orders List
import PurchaseHistoryScreen from './PurchaseHistoryScreen'; // NEW: Completed/Voided Orders
import InventoryScreen from './InventoryScreen'; // NEW: Stock List

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (userCredential) => {
      if (userCredential) {
        setUser(userCredential);
      } else {
        // Sign in anonymously if no user
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous sign-in error:", error);
        });
      }
      setLoading(false);
    });
    
    return unsubscribe; // Cleanup on unmount
  }, []);

  if (loading) {
    // Loading screen while connecting to Firebase
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0052cc" />
        <Text style={styles.loaderText}>Connecting...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Main" // CHANGED: Start with the Main Screen
        screenOptions={{ 
          headerShown: true,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#172b4d',
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen 
          name="Main" 
          component={MainScreen} 
          options={{ title: 'Tiger Mango POS', headerTitleAlign: 'center' }}
        />
        <Stack.Screen 
          name="TakeOrder" // NEW: Renamed POS to be more explicit in navigation
          component={POSScreen} 
          options={{ title: 'New Order' }}
        />
        <Stack.Screen 
          name="PendingOrders" 
          component={PendingOrdersScreen} 
          options={{ title: 'Pending Orders' }}
        />
        <Stack.Screen 
          name="PurchaseHistory" 
          component={PurchaseHistoryScreen} 
          options={{ title: 'Purchase History' }}
        />
        <Stack.Screen 
          name="Inventory" 
          component={InventoryScreen} 
          options={{ title: 'Inventory' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f5f7'
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#42526e'
  }
});