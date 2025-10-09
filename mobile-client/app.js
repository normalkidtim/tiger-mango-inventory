import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Image, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MenuScreen from './MenuScreen';
import OrderScreen from './OrderScreen';
import OrderReviewScreen from './OrderReviewScreen';
import { COLORS, SIZES, FONTS } from './styles';

// Import your images
// ✅ FINAL FIX: Changed the file extension from .jpg to .png to match your folder
const logo = require('./assets/logos/logo-black.png'); 
const featuredDrinks = [
  { name: 'Mango Cheesecake', image: require('./assets/images/mango-cheesecake.png') },
  { name: 'Mango Strawberry', image: require('./assets/images/mango-strawberry.png') },
  { name: 'Tiger Combo', image: require('./assets/images/tiger-combo.png') },
];

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="OrderScreen" component={OrderScreen} />
        <Stack.Screen name="OrderReviewScreen" component={OrderReviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function HomeScreen({ navigation }) {
  const renderFeaturedItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.featuredCard}
      onPress={() => navigation.navigate('OrderScreen', { selectedFlavor: item.name })}
    >
      <Image source={item.image} style={styles.featuredImage} />
      <Text style={styles.featuredTitle}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={logo} style={styles.logo} />
      </View>
      <Text style={styles.tagline}>Feel the Natural Taste of Mango</Text>
      
      <Text style={styles.sectionHeader}>Popular Orders</Text>
      <FlatList
        data={featuredDrinks}
        renderItem={renderFeaturedItem}
        keyExtractor={(item) => item.name}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SIZES.padding }}
      />
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.orderButton}
          onPress={() => navigation.navigate('Menu')}
        >
          <Text style={styles.orderButtonText}>Start Your Order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { alignItems: 'center', paddingVertical: 20 },
  logo: { width: 150, height: 100, resizeMode: 'contain' },
  tagline: { ...FONTS.h2, textAlign: 'center', paddingHorizontal: SIZES.padding, marginBottom: 30 },
  sectionHeader: { ...FONTS.h3, paddingHorizontal: SIZES.padding, marginBottom: 20 },
  featuredCard: { 
    backgroundColor: COLORS.lightGray, 
    borderRadius: 16, 
    padding: 15, 
    marginRight: 15, 
    alignItems: 'center',
    width: 160,
  },
  featuredImage: { width: 100, height: 100, resizeMode: 'contain', marginBottom: 10 },
  featuredTitle: { ...FONTS.body, fontWeight: '600' },
  footer: {
    padding: SIZES.padding,
    marginTop: 'auto',
  },
  orderButton: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 30,
    alignItems: 'center',
  },
  orderButtonText: {
    ...FONTS.h3,
    color: COLORS.white,
    fontSize: 18,
  },
});