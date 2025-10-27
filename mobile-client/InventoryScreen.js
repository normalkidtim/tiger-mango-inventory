import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { db } from './firebase'; 
import { collection, onSnapshot, query } from 'firebase/firestore'; 

import { Ionicons } from '@expo/vector-icons';
import { globalStyles, FONTS, COLORS, SIZES } from './styles';

// Helper function to format keys like 'large-cup' to 'Large Cup'
const formatKey = (key) => key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// Component to render a list of items for a specific inventory category
const InventoryCard = ({ title, data, iconName }) => {
  const items = data ? Object.entries(data).map(([key, value]) => ({
    name: formatKey(key),
    stock: value,
  })) : [];
  
  // Sort items alphabetically for consistent display
  items.sort((a, b) => a.name.localeCompare(b.name));

  // FIX: Used 'square-outline' as a fallback icon
  const icon = iconName || (title.toLowerCase().includes('cup') ? 'md-cup-outline' : 'square-outline');

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.itemList}>
        {items.length > 0 ? items.map((item, index) => (
          <View 
            key={item.name} 
            style={[
              styles.itemRow, 
              index < items.length - 1 && styles.itemSeparator
            ]}
          >
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemStock}>{item.stock.toLocaleString()}</Text>
          </View>
        )) : (
          // This Text component was already correct, but retaining it for context
          <Text style={styles.noData}>No items loaded in this category.</Text>
        )}
      </View>
    </View>
  );
};

const InventoryScreen = () => {
  const [inventoryData, setInventoryData] = useState({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const q = query(collection(db, 'inventory'));
    
    const unsub = onSnapshot(q, (querySnapshot) => {
      const data = {};
      querySnapshot.forEach((docSnap) => {
        data[docSnap.id] = docSnap.data();
      });
      setInventoryData(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching inventory:", error);
      Alert.alert("Error", "Failed to load inventory data.");
      setLoading(false);
    });

    return () => unsub(); 
  }, []);

  const iconMap = {
    'cups': 'md-cup-outline',
    'lids': 'md-albums-outline',
    'straws': 'md-water-outline',
    'add-ons': 'md-pricetag-outline',
  };

  const sortedCategories = Object.keys(inventoryData)
    .sort()
    .map(docId => ({
        id: docId,
        name: formatKey(docId),
        data: inventoryData[docId],
        icon: iconMap[docId] || 'square-outline' 
    }));


  return (
    <SafeAreaView style={globalStyles.container}> 
      <Text style={styles.screenTitle}>Inventory Stock</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading real-time stock...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {sortedCategories.length > 0 ? (
            sortedCategories.map(category => (
              <InventoryCard 
                key={category.id}
                title={category.name} 
                data={category.data} 
                iconName={category.icon}
              />
            ))
          ) : (
            // ✅ FIX APPLIED HERE: Ensure the fallback message is inside <Text>
            <Text style={styles.noDataMessage}>
                No inventory categories found. Please add them via the Web Client Inventory page.
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: FONTS.h2.fontSize,
    fontWeight: FONTS.h2.fontWeight,
    color: COLORS.text,
    padding: SIZES.padding,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  scrollContainer: {
    padding: SIZES.padding,
    paddingBottom: 50, // extra padding for bottom content
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.darkGray,
    fontSize: FONTS.body.fontSize,
  },
  noDataMessage: { 
    textAlign: 'center',
    marginTop: 40,
    fontSize: FONTS.body.fontSize,
    color: COLORS.darkGray,
  },
  // --- Card Styles ---
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemList: {
    paddingHorizontal: 15,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  itemName: {
    fontSize: 16,
    color: COLORS.text,
  },
  itemStock: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  noData: {
    paddingVertical: 20,
    textAlign: 'center',
    color: COLORS.darkGray,
    fontStyle: 'italic',
  }
});

export default InventoryScreen;