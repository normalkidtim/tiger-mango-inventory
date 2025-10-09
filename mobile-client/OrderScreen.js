import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons'; // ✅ Use the correct, built-in icon library
import { COLORS, SIZES, FONTS, globalStyles } from './styles';

// ... (keep the `drinks`, `prices`, and `addOnsList` constants as they are)
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
  'Pearl', 'Crushed Grahams', 'Oreo Crumble', 'Oreo Grahams', 'Strawberry Syrup',
  'Chocolate Syrup', 'Sliced Mango', 'Ice Cream',
];


export default function OrderScreen({ navigation, route }) {
  const existingItems = route.params?.items || [];
  const [selectedFlavor, setSelectedFlavor] = useState(route.params?.selectedFlavor || 'Mango Cheesecake');
  const [selectedSize, setSelectedSize] = useState('TALL');
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const toggleAddOn = (addOn) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOn) ? prev.filter((item) => item !== addOn) : [...prev, addOn]
    );
  };

  const handlePlaceOrder = () => {
    const newItem = {
      id: Date.now(),
      flavor: selectedFlavor,
      size: selectedSize,
      addOns: selectedAddOns,
      quantity,
      notes,
      price: prices[selectedSize] * quantity,
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
                {/* ✅ Use the correct icon component */}
                <Feather name="arrow-left" size={24} color={COLORS.text} />
            </TouchableOpacity>
        </View>

        <Image source={drinks[selectedFlavor]} style={styles.mainImage} />
        
        <View style={styles.optionsContainer}>
            <Text style={styles.flavorTitle}>{selectedFlavor}</Text>

            <Text style={styles.sectionTitle}>Flavor</Text>
            <View style={styles.optionsGrid}>
                {Object.keys(drinks).map((flavor) => (
                <TouchableOpacity
                    key={flavor}
                    style={[ styles.optionButton, selectedFlavor === flavor && styles.optionButtonSelected ]}
                    onPress={() => setSelectedFlavor(flavor)}
                >
                    <Text style={[ styles.optionButtonText, selectedFlavor === flavor && styles.optionButtonTextSelected ]}>
                    {flavor}
                    </Text>
                </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.sectionTitle}>Size</Text>
            <View style={styles.optionsGrid}>
                {Object.keys(prices).map((size) => (
                <TouchableOpacity
                    key={size}
                    style={[ styles.optionButton, selectedSize === size && styles.optionButtonSelected ]}
                    onPress={() => setSelectedSize(size)}
                >
                    <Text style={[ styles.optionButtonText, selectedSize === size && styles.optionButtonTextSelected ]}>
                    {size}
                    </Text>
                </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.sectionTitle}>Add-ons</Text>
            <View style={styles.optionsGrid}>
                {addOnsList.map((addOn) => (
                <TouchableOpacity
                    key={addOn}
                    style={[ styles.optionButton, selectedAddOns.includes(addOn) && styles.optionButtonSelected ]}
                    onPress={() => toggleAddOn(addOn)}
                >
                    <Text style={[ styles.optionButtonText, selectedAddOns.includes(addOn) && styles.optionButtonTextSelected ]}>
                    {addOn}
                    </Text>
                </TouchableOpacity>
                ))}
            </View>

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

            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
                style={styles.notesInput}
                placeholder="Add special instructions..."
                placeholderTextColor="#999"
                value={notes}
                onChangeText={setNotes}
            />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total Price</Text>
          <Text style={styles.priceValue}>₱{prices[selectedSize] * quantity}</Text>
        </View>
        <TouchableOpacity style={styles.addToCartButton} onPress={handlePlaceOrder}>
          <Text style={styles.addToCartButtonText}>Add to Order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  mainImage: {
    width: '80%',
    height: 250,
    alignSelf: 'center',
    resizeMode: 'contain',
    marginTop: 10,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  flavorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  optionButtonSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  optionButtonTextSelected: {
    fontWeight: '700',
    color: '#000',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    alignSelf: 'center',
  },
  quantityButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  quantityButtonText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#333',
  },
  quantityText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111',
    minWidth: 40,
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    minHeight: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
  },
  addToCartButton: {
    backgroundColor: '#E53935',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 3,
  },
  addToCartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});