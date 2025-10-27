import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, globalStyles } from './styles'; // ADDED FONTS AND globalStyles

const { width } = Dimensions.get('window');
const BUTTON_SIZE = (width - SIZES.padding * 3) / 2;

const MenuButton = ({ title, iconName, color, onPress }) => (
  <TouchableOpacity
    style={[styles.button, { backgroundColor: color }]}
    onPress={onPress}
  >
    {/* Ensure you have @expo/vector-icons installed: expo install @expo/vector-icons */}
    <Ionicons name={iconName} size={40} color={COLORS.white} />
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

const MainScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Dashboard</Text>
      <View style={styles.grid}>
        <MenuButton
          title="Take Order"
          iconName="cart"
          color="#E53935" // Primary Color: Brand Red
          onPress={() => navigation.navigate('TakeOrder')}
        />
        <MenuButton
          title="Pending Orders"
          iconName="time"
          color="#FFD700" // Accent Color: Gold
          onPress={() => navigation.navigate('PendingOrders')}
        />
        <MenuButton
          title="Purchase History"
          iconName="list-circle"
          color="#388E3C" // Green
          onPress={() => navigation.navigate('PurchaseHistory')}
        />
        <MenuButton
          title="Inventory"
          iconName="cube"
          color="#1976D2" // Blue
          onPress={() => navigation.navigate('Inventory')}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  header: {
    fontSize: 28, // Using explicit size to ensure styling
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
    textAlign: 'center',
    marginTop: 20, // Add a bit of top margin for better look
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 12,
    marginBottom: SIZES.padding,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: SIZES.h3, // Using SIZES.h3 from styles.js
    color: COLORS.white,
    marginTop: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MainScreen;