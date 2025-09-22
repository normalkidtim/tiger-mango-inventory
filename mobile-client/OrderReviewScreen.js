import React, { useState, useEffect } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, StatusBar, FlatList } from 'react-native';
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

export default function OrderReviewScreen({ route, navigation }) {
  const { items: initialItems } = route.params || {};
  const [items, setItems] = useState(initialItems || []);

  useEffect(() => {
    if (initialItems) {
      setItems(initialItems);
    }
  }, [initialItems]);

  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.price, 0);
  };

  const handleDelete = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleEdit = (itemToEdit) => {
    alert('Edit feature coming soon!');
  };

  const renderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <Image source={drinks[item.flavor]} style={styles.drinkImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.flavorText}>{item.flavor}</Text>
        <Text style={styles.detailText}>Size: {item.size}</Text>
        {item.addOns.length > 0 && (
          <Text style={styles.detailText}>Add-ons: {item.addOns.join(', ')}</Text>
        )}
        <Text style={styles.detailText}>Quantity: {item.quantity}</Text>
        <Text style={styles.priceText}>₱{item.price}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEdit(item)}
        >
          {/* FIXED: Removed the emoji */}
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          {/* FIXED: Removed the emoji */}
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent={true} backgroundColor="transparent" />

      <View style={styles.header}>
        <Text style={styles.title}>Order Review</Text>
        <Text style={styles.totalText}>Total: ₱{calculateTotal()}</Text>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No items yet. Add your first drink!</Text>
        }
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={() => navigation.navigate('OrderScreen', { items: items })}
        >
          <Text style={styles.buttonText}>← Add More Drinks</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.proceedButton]}
          onPress={() => alert('Proceed to Payment')}
        >
          <Text style={styles.buttonText}>Proceed</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E53935', padding: 16 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  totalText: { fontSize: 20, fontWeight: 'bold', color: '#FFD700', marginTop: 8 },
  list: { flex: 1 },
  emptyText: { color: 'white', fontSize: 16, textAlign: 'center', marginTop: 20 },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  drinkImage: { width: 80, height: 80, borderRadius: 8, marginRight: 16 },
  itemDetails: { flex: 1 },
  flavorText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  detailText: { fontSize: 14, color: '#666', marginBottom: 4 },
  priceText: { fontSize: 20, fontWeight: 'bold', color: '#E53935' },
  actionButtons: { marginLeft: 16, alignItems: 'center' },
  editButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: '#E53935',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionText: { fontSize: 12, fontWeight: 'bold', color: 'black' },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  backButton: { backgroundColor: '#333' },
  proceedButton: { backgroundColor: '#FFD700' },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
});