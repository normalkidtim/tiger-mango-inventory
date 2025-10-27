// mobile-client/app.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; 
// NEW IMPORTS: For fetching user profile
import { getFirestore, doc, getDoc } from 'firebase/firestore';

import './firebase'; 
import LoginScreen from './LoginScreen'; 
import MainScreen from './MainScreen'; 
import POSScreen from './POSScreen'; 
import PendingOrdersScreen from './PendingOrdersScreen'; 
import PurchaseHistoryScreen from './PurchaseHistoryScreen'; 
import InventoryScreen from './InventoryScreen'; 
import { MenuProvider } from './MenuContext'; 

const Stack = createStackNavigator();
const db = getFirestore();

// Helper function to fetch the user's detailed profile from Firestore
async function fetchUserProfile(user) {
    if (!user || user.isAnonymous) return null;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
            ...user,
            ...userData,
            fullName: `${userData.firstName} ${userData.lastName}`,
            role: userData.role
        };
    } 
    return null; // Profile doesn't exist
}

export default function App() {
  const [user, setUser] = useState(null);
  // NEW: State for the detailed user profile (including name/role)
  const [userProfile, setUserProfile] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (userCredential) => {
      
      if (userCredential) {
        // If an Auth user is present, fetch their complete profile
        const profile = await fetchUserProfile(userCredential);
        
        if (profile) {
            // User is authenticated and has a valid Firestore profile
            setUserProfile(profile);
        } else {
            // User authenticated but profile deleted by admin -> force logout
            console.warn("Mobile: User authenticated but profile not found. Logging out.");
            await auth.signOut();
            setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });
    
    return unsubscribe; 
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0052cc" />
        <Text style={styles.loaderText}>Connecting...</Text>
      </View>
    );
  }
  
  // RENDER LOGIN: If userProfile is null, show the login screen.
  if (!userProfile) {
    return <LoginScreen />;
  }

  // RENDER MAIN APP: Pass the userProfile data to MainScreen
  return (
    <NavigationContainer>
      <MenuProvider>
        <Stack.Navigator 
          initialRouteName="Main"
          screenOptions={{ 
            headerShown: true,
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: '#172b4d',
            headerTitleStyle: { fontWeight: '600' },
          }}
        >
          <Stack.Screen 
            name="Main" 
            // Pass the userProfile object to MainScreen
            children={(props) => <MainScreen {...props} userProfile={userProfile} />} 
            options={{ title: 'Tiger Mango POS', headerTitleAlign: 'center' }}
          />
          <Stack.Screen 
            name="TakeOrder" 
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
      </MenuProvider>
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