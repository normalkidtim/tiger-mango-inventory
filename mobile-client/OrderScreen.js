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

// Import drink images
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

// Price map
const prices = {
  TALL: 85,
  GRANDE: 100,
  '1LITER': 135,
};

// ✅ Add-ons (matching your database)
const addOnsList = [
  'Pearl',
  'Crushed Grahams',
  'Oreo Crumble',
  'Oreo Grahams',
  'Strawberry Syrup',
  'Chocolate Syrup',
  'Sliced Mango',
  'Ice Cream',
];

export default function OrderScreen({ navigation, route }) {
  const existingItems = route.params?.items || [];

  // ✅ Default to selected flavor from MenuScreen (if provided)
  const [selectedFlavor, setSelectedFlavor] = useState(
    route.params?.selectedFlavor || 'Mango Cheesecake'
  );
  const [selectedSize, setSelectedSize] = useState('TALL');
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const toggleAddOn = (addOn) => {
    if (selectedAddOns.includes(addOn)) {
      setSelectedAddOns(selectedAddOns.filter((item) => item !== addOn));
    } else {
      setSelectedAddOns([...selectedAddOns, addOn]);
    }
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

  const handleGoBack = () => {
    navigation.navigate('Menu');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent={true} backgroundColor="transparent" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← BACK</Text>
          </TouchableOpacity>
        </View>

        {/* Big Image */}
        <View style={styles.imageContainer}>
          <Image
            source={drinks[selectedFlavor]}
            style={styles.bigImage}
            resizeMode="contain"
          />
        </View>

        {/* Flavor Grid */}
        <Text style={styles.sectionTitle}>SELECT FLAVOR</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.flavorScroll}
        >
          <View style={styles.flavorGrid}>
            {Object.keys(drinks).map((flavor) => (
              <TouchableOpacity
                key={flavor}
                style={[
                  styles.flavorButton,
                  selectedFlavor === flavor && styles.flavorButtonSelected,
                ]}
                onPress={() => setSelectedFlavor(flavor)}
              >
                <Text
                  style={[
                    styles.flavorText,
                    selectedFlavor === flavor && styles.flavorTextSelected,
                  ]}
                >
                  {flavor}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Size Selection */}
        <Text style={styles.sectionTitle}>SIZE</Text>
        <View style={styles.sizeContainer}>
          {Object.keys(prices).map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.sizeButton,
                selectedSize === size && styles.sizeButtonSelected,
              ]}
              onPress={() => setSelectedSize(size)}
            >
              <Text
                style={[
                  styles.sizeText,
                  selectedSize === size && styles.sizeTextSelected,
                ]}
              >
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add-ons */}
        <Text style={styles.sectionTitle}>ADD ONS</Text>
        <View style={styles.addOnsContainer}>
          {addOnsList.map((addOn) => (
            <TouchableOpacity
              key={addOn}
              style={[
                styles.addOnButton,
                selectedAddOns.includes(addOn) && styles.addOnButtonSelected,
              ]}
              onPress={() => toggleAddOn(addOn)}
            >
              <Text
                style={[
                  styles.addOnText,
                  selectedAddOns.includes(addOn) && styles.addOnTextSelected,
                ]}
              >
                {addOn}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quantity */}
        <Text style={styles.sectionTitle}>QUANTITY</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
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

        {/* Notes */}
        <Text style={styles.sectionTitle}>NOTES (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Special instructions..."
          placeholderTextColor="#999"
          value={notes}
          onChangeText={setNotes}
          multiline={true}
        />

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Place Order Button */}
      <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
        <Text style={styles.placeOrderButtonText}>PLACE ORDER</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E53935', padding: 16 },
  scrollContent: { paddingBottom: 80 },
  header: { marginBottom: 16 },
  backButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  imageContainer: {
    height: 200,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },
  bigImage: { width: '90%', height: '80%', resizeMode: 'contain' },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  flavorScroll: { marginBottom: 20 },
  flavorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flavorButton: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  flavorButtonSelected: { backgroundColor: '#FFD700' },
  flavorText: { fontSize: 14, fontWeight: '500', color: '#333' },
  flavorTextSelected: { color: 'black', fontWeight: 'bold' },
  sizeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  sizeButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sizeButtonSelected: { backgroundColor: '#FFD700' },
  sizeText: { fontSize: 14, fontWeight: '500', color: '#333' },
  sizeTextSelected: { color: 'black', fontWeight: 'bold' },
  addOnsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  addOnButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addOnButtonSelected: { backgroundColor: '#FFD700' },
  addOnText: { color: 'white', fontSize: 14 },
  addOnTextSelected: { color: 'black', fontWeight: 'bold' },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  quantityButton: {
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  quantityText: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  notesInput: {
    backgroundColor: 'white',
    height: 60,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    textAlignVertical: 'top',
    fontSize: 16,
    color: 'black',
  },
  placeOrderButton: {
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
  placeOrderButtonText: { color: 'black', fontSize: 18, fontWeight: 'bold' },
});
