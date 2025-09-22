import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Image, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MenuScreen from './MenuScreen';
import OrderScreen from './OrderScreen';
import OrderReviewScreen from './OrderReviewScreen';

// Import your images
const flavorBanner1 = require('./assets/images/flavorbanner1.png');
const flavorBanner2 = require('./assets/images/flavorbanner2.png');

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Menu"
          component={MenuScreen}
          options={{ headerShown: false }} // Hide header for MenuScreen
        />
        <Stack.Screen
          name="OrderScreen"
          component={OrderScreen}
          options={{ headerShown: false }} // Hide header for OrderScreen
        />
        <Stack.Screen
          name="OrderReviewScreen"
          component={OrderReviewScreen}
          options={{ headerShown: false }} // Hide header for OrderReviewScreen
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent={true} backgroundColor="transparent" />
      <Image source={flavorBanner1} style={styles.bannerTop} resizeMode="cover" />
      <View style={styles.redSection}>
        <Text style={styles.flavorsText}>FLAVORS</Text>
        <Image source={flavorBanner2} style={styles.drinkGrid} resizeMode="contain" />
        <TouchableOpacity
          style={styles.orderButton}
          onPress={() => navigation.navigate('Menu')}
        >
          <Text style={styles.orderButtonText}>ORDER</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bannerTop: { width: '100%', height: 200 },
  redSection: {
    flex: 1,
    backgroundColor: '#E53935',
    alignItems: 'center',
    paddingTop: 20,
  },
  flavorsText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  drinkGrid: { width: '90%', height: 320, marginVertical: 20 },
  orderButton: {
    width: 200,
    height: 44,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  orderButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
});