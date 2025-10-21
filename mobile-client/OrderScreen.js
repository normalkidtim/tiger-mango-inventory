import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { COLORS, SIZES, FONTS, globalStyles } from './styles';

// Constants for drinks, prices, and add-ons
const drinks = {
  'Mango Cheesecake': require('./assets/images/mango-cheesecake.png'),
  'Mango Ice Cream': require('./assets/images/mango-ice-cream.png'),
  'Mango Strawberry': require('./assets/images/mango-strawberry.png'),
  'Tiger Combo': require('./assets/images/tiger-combo.png'),
  'Mango Chocolate': require('./assets/images/mango-chocolate.png'),
  'Mango Banana': require('./assets/images/mango-banana.png'),
  'Mango Cashews': require('./assets/images/mango-cashews.png'),
  'Mango Chips': require('./assets/images/mango-chips.png'),
  'Mango Graham': require('./assets/images/mango-graham.png'),
};
const prices = { TALL: 85, GRANDE: 100, '1LITER': 135 };
const addOnsList = [
  { name: 'Pearl', price: 10 }, { name: 'Crushed Grahams', price: 10 },
  { name: 'Oreo Crumble', price: 10 }, { name: 'Oreo Grahams', price: 10 },
  { name: 'Strawberry Syrup', price: 10 }, { name: 'Chocolate Syrup', price: 10 },
  { name: 'Sliced Mango', price: 10 }, { name: 'Ice Cream', price: 10 },
];
const ADD_ON_PRICE = 10;
const firebaseAddonKeys = {
  "Pearl": "pearl", "Crushed Grahams": "crushed-grahams", "Oreo Crumble": "oreo-crumble",
  "Oreo Grahams": "oreo-grahams", "Strawberry Syrup": "strawberry-syrup",
  "Chocolate Syrup": "chocolate-syrup", "Sliced Mango": "sliced-mango", "Ice Cream": "ice-cream",
};

export default function OrderScreen({ navigation, route }) {
  const existingItems = route.params?.items || [];
  const [selectedFlavor, setSelectedFlavor] = useState(route.params?.selectedFlavor || 'Mango Cheesecake');
  const [selectedSize, setSelectedSize] = useState('TALL');
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [quantity, setQuantity] = useState(1);
  
  const [cupStock, setCupStock] = useState({});
  const [addonStock, setAddonStock] = useState({});

  useEffect(() => {
    const unsubCups = onSnapshot(doc(db, "inventory", "cups"), (doc) => setCupStock(doc.data() || {}));
    const unsubAddons = onSnapshot(doc(db, "inventory", "add-ons"), (doc) => setAddonStock(doc.data() || {}));
    return () => { unsubCups(); unsubAddons(); };
  }, []);

  const totalPrice = useMemo(() => {
    const sizePrice = prices[selectedSize];
    const addOnsPrice = selectedAddOns.length * ADD_ON_PRICE;
    return (sizePrice + addOnsPrice) * quantity;
  }, [selectedSize, selectedAddOns, quantity]);

  const toggleAddOn = (addOnName) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOnName) ? prev.filter((item) => item !== addOnName) : [...prev, addOnName]
    );
  };

  const handlePlaceOrder = () => {
    const newItem = {
      id: Date.now(),
      flavor: selectedFlavor,
      size: selectedSize,
      addOns: selectedAddOns,
      quantity,
      price: totalPrice,
    };
    const allItems = [...existingItems, newItem];
    navigation.navigate('OrderReviewScreen', { items: allItems });
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Feather name="arrow-left" size={24} color={COLORS.text} />
            </TouchableOpacity>
        </View>

        <Image source={drinks[selectedFlavor]} style={styles.mainImage} />
        
        <View style={styles.optionsContainer}>
            <Text style={styles.flavorTitle}>{selectedFlavor}</Text>

            <Text style={styles.sectionTitle}>Size</Text>
            <View style={styles.optionsGrid}>
                {Object.keys(prices).map((size) => {
                  // ✅ FIX: Use 'liter' for '1LITER' to match the database key
                  const stockKey = size === '1LITER' ? 'liter' : size.toLowerCase();
                  const isOutOfStock = (cupStock[stockKey] || 0) < 1;
                  return (
                    <TouchableOpacity
                        key={size}
                        style={[ styles.optionButton, selectedSize === size && styles.optionButtonSelected, isOutOfStock && styles.optionButtonDisabled ]}
                        onPress={() => setSelectedSize(size)}
                        disabled={isOutOfStock}
                    >
                        <Text style={[ styles.optionButtonText, selectedSize === size && styles.optionButtonTextSelected, isOutOfStock && styles.optionButtonTextDisabled ]}>
                        {size}
                        </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>

            <Text style={styles.sectionTitle}>Add-ons</Text>
            <View style={styles.optionsGrid}>
                {addOnsList.map((addOn) => {
                  const addonKey = firebaseAddonKeys[addOn.name];
                  const isOutOfStock = (addonStock[addonKey] || 0) < 1;
                  return (
                    <TouchableOpacity
                        key={addOn.name}
                        style={[ styles.optionButton, selectedAddOns.includes(addOn.name) && styles.optionButtonSelected, isOutOfStock && styles.optionButtonDisabled ]}
                        onPress={() => toggleAddOn(addOn.name)}
                        disabled={isOutOfStock}
                    >
                        <Text style={[ styles.optionButtonText, selectedAddOns.includes(addOn.name) && styles.optionButtonTextSelected, isOutOfStock && styles.optionButtonTextDisabled ]}>
                          {addOn.name} (+₱{addOn.price})
                        </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>

            {/* ✅ RESTORED: Quantity Section */}
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantityContainer}>
                <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                    <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(quantity + 1)}
                >
                    <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            {/* ✅ REMOVED: Notes Section is now gone */}
        </View>
      </ScrollView>

      {/* ✅ RESTORED: Footer / Add to Order Section */}
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total Price</Text>
          <Text style={styles.priceValue}>₱{totalPrice}</Text>
        </View>
        <TouchableOpacity style={styles.addToCartButton} onPress={handlePlaceOrder}>
          <Text style={styles.addToCartButtonText}>Add to Order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5F7' },
  header: { paddingHorizontal: 20, paddingTop: 10 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  mainImage: { width: '80%', height: 250, alignSelf: 'center', resizeMode: 'contain', marginTop: 10 },
  optionsContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  flavorTitle: { fontSize: 28, fontWeight: 'bold', color: '#111', textAlign: 'center', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 12 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  optionButton: { backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#EAEAEA' },
  optionButtonSelected: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  optionButtonText: { fontSize: 14, fontWeight: '500', color: '#333' },
  optionButtonTextSelected: { fontWeight: '700', color: '#000' },
  optionButtonDisabled: { backgroundColor: '#F0F0F0', borderColor: '#E0E0E0' },
  optionButtonTextDisabled: { color: '#A0A0A0', textDecorationLine: 'line-through' },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24, alignSelf: 'center' },
  quantityButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EAEAEA' },
  quantityButtonText: { fontSize: 24, fontWeight: '300', color: '#333' },
  quantityText: { fontSize: 24, fontWeight: '600', color: '#111', minWidth: 40, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EAEAEA' },
  priceContainer: { flex: 1 },
  priceLabel: { fontSize: 14, color: '#666' },
  priceValue: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  addToCartButton: { backgroundColor: '#E53935', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 30, elevation: 3 },
  addToCartButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});