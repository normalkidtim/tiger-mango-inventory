import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
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

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name={iconName} size={20} color={COLORS.primary} />
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
          <Text style={styles.noData}>No items loaded in this category.</Text>
        )}
      </View>
    </View>
  );
};

const InventoryScreen = () => {
  const [inventoryData, setInventoryData] = useState({
    cups: null,
    lids: null,
    straws: null,
    addons: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Array of documents to listen to
    const documentsToFetch = [
      { key: 'cups', docId: 'cups' },
      { key: 'lids', docId: 'lids' },
      { key: 'straws', docId: 'straws' },
      { key: 'addons', docId: 'add-ons' }, // Matches your Firebase structure: inventory/add-ons
    ];

    const unsubscribers = documentsToFetch.map(({ key, docId }) => {
      // Listen to a single document within the 'inventory' collection
      const docRef = doc(db, 'inventory', docId);
      
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        setInventoryData(prev => ({
          ...prev,
          [key]: docSnap.data() || {}, // Store the fields/values
        }));
        
        // Only set loading to false once after the initial data load
        if (loading) {
            setLoading(false);
        }
      }, (error) => {
        console.error(`Error fetching ${docId} inventory:`, error);
        if (loading) {
            Alert.alert("Error", `Failed to fetch inventory data for ${docId}.`);
            setLoading(false);
        }
      });

      return unsubscribe;
    });

    // Handle initial loading state timeout just in case
    const timer = setTimeout(() => {
        if (loading) setLoading(false);
    }, 5000); 

    // Cleanup all subscriptions on component unmount
    return () => {
        unsubscribers.forEach(unsub => unsub());
        clearTimeout(timer);
    };
  }, []); // Empty dependency array means this runs only once on mount

  // Check if any of the main data sections are still null (initial state)
  const isDataLoading = loading || 
    inventoryData.cups === null || 
    inventoryData.lids === null || 
    inventoryData.straws === null || 
    inventoryData.addons === null;

  return (
    <SafeAreaView style={globalStyles.container}>
      <Text style={styles.screenTitle}>Inventory Stock</Text>
      
      {isDataLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading real-time stock...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <InventoryCard 
            title="Cups" 
            data={inventoryData.cups} 
            iconName="md-cup-outline"
          />
          <InventoryCard 
            title="Lids" 
            data={inventoryData.lids} 
            iconName="md-albums-outline"
          />
          <InventoryCard 
            title="Straws" 
            data={inventoryData.straws} 
            iconName="md-water-outline"
          />
          <InventoryCard 
            title="Add-ons" 
            data={inventoryData.addons} 
            iconName="md-pricetag-outline"
          />
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