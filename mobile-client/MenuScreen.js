import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import OrderScreen from './OrderScreen';

// Import drink images
const mangoCheesecake = require('./assets/images/mango-cheesecake.png');
const mangoIceCream = require('./assets/images/mango-ice-cream.png');
const mangoStrawberry = require('./assets/images/mango-strawberry.png');
const tigerCombo = require('./assets/images/tiger-combo.png');
const mangoChocolate = require('./assets/images/mango-chocolate.png');
const mangoBanana = require('./assets/images/mango-banana.png');
const mangoCashews = require('./assets/images/mango-cashews.png');
const mangoChips = require('./assets/images/mango-chips.png');
const mangoGraham = require('./assets/images/mango-graham.png');

export default function MenuScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Make status bar visible */}
      <StatusBar translucent={true} backgroundColor="transparent" />

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Drink Grid */}
        <View style={styles.grid}>
          {/* Row 1 */}
          <View style={styles.card}>
            <Image source={mangoCheesecake} style={styles.drinkImage} />
            <Text style={styles.drinkName}>Mango Cheesecake</Text>
          </View>
          <View style={styles.card}>
            <Image source={mangoIceCream} style={styles.drinkImage} />
            <Text style={styles.drinkName}>Mango Ice Cream</Text>
          </View>
          <View style={styles.card}>
            <Image source={mangoStrawberry} style={styles.drinkImage} />
            <Text style={styles.drinkName}>Mango Strawberry</Text>
          </View>

          {/* Row 2 */}
          <View style={styles.card}>
            <Image source={tigerCombo} style={styles.drinkImage} />
            <Text style={styles.drinkName}>Tiger Combo</Text>
          </View>
          <View style={styles.card}>
            <Image source={mangoChocolate} style={styles.drinkImage} />
            <Text style={styles.drinkName}>Mango Chocolate</Text>
          </View>
          <View style={styles.card}>
            <Image source={mangoBanana} style={styles.drinkImage} />
            <Text style={styles.drinkName}>Mango Banana</Text>
          </View>

          {/* Row 3 */}
          <View style={styles.card}>
            <Image source={mangoCashews} style={styles.drinkImage} />
            <Text style={styles.drinkName}>Mango Cashews</Text>
          </View>
          <View style={styles.card}>
            <Image source={mangoChips} style={styles.drinkImage} />
            <Text style={styles.drinkName}>Mango Chips</Text>
          </View>
          <View style={styles.card}>
            <Image source={mangoGraham} style={styles.drinkImage} />
            <Text style={styles.drinkName}>Mango Graham</Text>
          </View>
        </View>

        {/* Pricing Section */}
        <View style={styles.pricingSection}>
          {/* Price Rows */}
          <View style={styles.priceRow}>
            <Text style={styles.sizeText}>TALL</Text>
            <Text style={styles.priceText}>85</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.sizeText}>GRANDE</Text>
            <Text style={styles.priceText}>100</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.sizeText}>1LITER</Text>
            <Text style={styles.priceText}>135</Text>
          </View>

          {/* Add-ons */}
          <Text style={styles.addOnsTitle}>ADD ONS:</Text>
          <View style={styles.addOnsContainer}>
            <Text style={styles.addOnText}>Pearl</Text>
            <Text style={styles.addOnText}>Crash Grahams</Text>
            <Text style={styles.addOnText}>Oreo Crumble</Text>
            <Text style={styles.addOnText}>Strawberry/Chocolate Syrup</Text>
            <Text style={styles.addOnText}>Sliced Mango</Text>
            <Text style={styles.addOnText}>Ice Cream</Text>
          </View>
        </View>

        {/* Spacer to push button down */}
        <View style={{ height: 20 }} />

      </ScrollView>

      {/* Proceed Button (Sticky at Bottom) */}
      <TouchableOpacity
        style={styles.proceedButton}
        onPress={() => navigation.navigate('OrderScreen')}
      >
        <Text style={styles.proceedButtonText}>PROCEED</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E53935',
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 80, // Make space for sticky button
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: '30%',
    aspectRatio: 1,
    marginBottom: 15,
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  drinkImage: {
    width: '100%',
    height: '70%',
    resizeMode: 'cover',
  },
  drinkName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 5,
    color: '#333',
  },
  pricingSection: {
    backgroundColor: 'black',
    padding: 16,
    borderRadius: 16,
    marginTop: 'auto',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sizeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  priceText: {
    color: 'red',
    fontSize: 22,
    fontWeight: 'bold',
  },
  addOnsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  addOnsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addOnText: {
    color: 'white',
    fontSize: 14,
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  proceedButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: '10%',
    right: '10%',
    zIndex: 10,
  },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
});