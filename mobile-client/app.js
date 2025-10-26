import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

import './firebase'; // This initializes Firebase
import POSScreen from './POSScreen'; // Import the new POS screen

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
        initialRouteName="POS"
        screenOptions={{ 
          headerShown: true,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#172b4d',
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen 
          name="POS" 
          component={POSScreen} 
          options={{ title: 'Tiger Mango POS' }}
        />
        {/* You can add other screens like 'OrderHistory' here later */}
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