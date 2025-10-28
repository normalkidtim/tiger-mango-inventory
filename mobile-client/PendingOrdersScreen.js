// mobile-client/PendingOrdersScreen.js

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  StyleSheet,
  ActivityIndicator,
  Alert 
} from 'react-native';
import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  getFirestore, 
  runTransaction,
} from 'firebase/firestore';
import { globalStyles, FONTS, COLORS, SIZES } from './styles';
import { Ionicons } from '@expo/vector-icons';

const formatPrice = (price) => `₱${price.toFixed(2)}`;
const firestore = getFirestore();

// Helper function to format keys like 'large-cup' to 'Large Cup'
const formatKey = (key) => key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
// Helper function to consistently get a category ID from the stored name
const getCategoryId = (name) => name.toLowerCase().replace(/ /g, '-');


// --- DEDUCTION CONSTANTS (FIXED TO MATCH SLUGGED CATEGORY IDS) ---

// The slugged category IDs from your menu were: milktea, iced-coffee, fruit-tea, soda, milk-series, latte-series, non-coffee, hot-drinks, yogurt-series, fruit-tea-yogurt, frappe.

const FLAT_LID_CATEGORIES = [
  'milktea', 
  'iced-coffee', 
  'fruit-tea', 
  'soda', 
  'milk-series', 
  'latte-series', 
  'non-coffee', 
  'hot-drinks', 
  'yogurt-series', 
  'fruit-tea-yogurt'
];
const DOME_LID_CATEGORIES = ['frappe']; 

const BOBA_STRAW_CATEGORIES = [
  'milktea', 
  'fruit-tea', 
  'milk-series', 
  'hot-drinks', 
  'yogurt-series', 
  'fruit-tea-yogurt'
];
const THIN_STRAW_CATEGORIES = [
  'iced-coffee', 
  'soda', 
  'latte-series', 
  'non-coffee'
];


// --- INVENTORY DEDUCTION LOGIC (STRICT AND CORRECT) ---
const updateInventory = async (orderId, orderItems) => {
    // Document IDs must match your Firestore collection
    const inventoryRefs = {
        cups: doc(firestore, 'inventory', 'cups'),
        lids: doc(firestore, 'inventory', 'lids'),
        straws: doc(firestore, 'inventory', 'straws'),
        addons: doc(firestore, 'inventory', 'add-ons'),
    };

    // Deduction calculation structure (matching Firestore field names)
    const deductions = {
        cups: { 'medium-cup': 0, 'large-cup': 0 }, 
        lids: { 'flat-lid': 0, 'dome-lid': 0 },     
        straws: { 'boba-straw': 0, 'thin-straw': 0 },
        addons: {},
    };

    // 1. Calculate Deductions
    orderItems.forEach(item => {
        const quantity = item.quantity;
        const size = item.size; 
        
        // This must match the ID used in the deduction categories list
        const categoryId = getCategoryId(item.categoryName); 

        // Cup Deduction (UNMODIFIED - Always deducts the cup)
        const cupKey = `${size}-cup`; 
        deductions.cups[cupKey] = (deductions.cups[cupKey] || 0) + quantity;

        // Lid Deduction (MODIFIED LOGIC: Check item-specific recipe first)
        let lidToDeduct = null;
        
        // 1. Check for product-specific recipe (new feature)
        // We check for the presence of the property, NOT just if it's truthy (to handle 'none' which is a saved string)
        if (Object.prototype.hasOwnProperty.call(item, 'lidType')) { 
             // Only set for deduction if the recipe is NOT 'none' or null/undefined
             if (item.lidType && item.lidType !== 'none') {
                lidToDeduct = item.lidType;
             }
        } 
        // 2. Fallback to existing category-based logic (for old items that lack the property)
        else {
            if (DOME_LID_CATEGORIES.includes(categoryId)) {
                lidToDeduct = 'dome-lid';
            } else if (FLAT_LID_CATEGORIES.includes(categoryId)) {
                lidToDeduct = 'flat-lid';
            }
        }

        // Only deduct if a valid lid type key is set
        if (lidToDeduct) {
            deductions.lids[lidToDeduct] = (deductions.lids[lidToDeduct] || 0) + quantity;
        }
        
        // Straw Deduction (MODIFIED LOGIC: Check item-specific recipe first)
        let strawToDeduct = null;
        
        // 1. Check for product-specific recipe (new feature)
        // We check for the presence of the property, NOT just if it's truthy (to handle 'none' which is a saved string)
        if (Object.prototype.hasOwnProperty.call(item, 'strawType')) { 
             // Only set for deduction if the recipe is NOT 'none' or null/undefined
            if (item.strawType && item.strawType !== 'none') {
                strawToDeduct = item.strawType;
            }
        }
        // 2. Fallback to existing category-based logic (for old items that lack the property)
        else {
            if (BOBA_STRAW_CATEGORIES.includes(categoryId)) {
                strawToDeduct = 'boba-straw';
            } else if (THIN_STRAW_CATEGORIES.includes(categoryId)) {
                strawToDeduct = 'thin-straw';
            }
        }

        // Only deduct if a valid straw type key is set
        if (strawToDeduct) {
            deductions.straws[strawToDeduct] = (deductions.straws[strawToDeduct] || 0) + quantity;
        }

        // Add-ons Deduction (UNMODIFIED)
        if (item.addons && item.addons.length > 0) {
            item.addons.forEach(addon => {
                const addonKey = addon.id;
                deductions.addons[addonKey] = (deductions.addons[addonKey] || 0) + quantity;
            });
        }
    });

    // 2. Run Transaction for Atomic Inventory Update
    await runTransaction(firestore, async (transaction) => {
        // Fetch current stock levels within the transaction
        const currentCups = (await transaction.get(inventoryRefs.cups)).data();
        const currentLids = (await transaction.get(inventoryRefs.lids)).data();
        const currentStraws = (await transaction.get(inventoryRefs.straws)).data();
        const currentAddons = (await transaction.get(inventoryRefs.addons)).data();

        const newCups = { ...currentCups };
        const newLids = { ...currentLids };
        const newStraws = { ...currentStraws };
        const newAddons = { ...currentAddons };

        // Helper function for strict stock checking and deduction
        const performDeduction = (currentStock, newStock, deductionMap, typeName) => {
            for (const [key, qty] of Object.entries(deductionMap)) {
                if (qty > 0) {
                    const stock = currentStock?.[key] || 0;
                    
                    if (stock < qty) {
                        const itemName = typeName === 'Add-on' ? `Add-on: ${formatKey(key)}` : formatKey(key);
                        throw new Error(`Insufficient stock for ${itemName}.`);
                    }
                    // Perform actual deduction
                    newStock[key] = stock - qty;
                }
            }
        };

        // Apply strict deduction to all categories
        performDeduction(currentCups, newCups, deductions.cups, 'Cup');
        performDeduction(newLids, newLids, deductions.lids, 'Lid'); 
        performDeduction(newStraws, newStraws, deductions.straws, 'Straw'); 
        performDeduction(newAddons, newAddons, deductions.addons, 'Add-on');


        // 3. Commit all changes
        transaction.update(inventoryRefs.cups, newCups);
        transaction.update(inventoryRefs.lids, newLids);
        transaction.update(inventoryRefs.straws, newStraws);
        transaction.update(inventoryRefs.addons, newAddons);
    });
};

// --- SCREEN COMPONENT ---

const PendingOrdersScreen = () => {
  const [pendingOrders, setPendingOrders] = useState([]); 
  const [loading, setLoading] = useState(true);

  // 1. Fetch pending orders using real-time listener (onSnapshot)
  useEffect(() => {
    // Query for orders where the status is 'Pending'
    const q = query(collection(db, 'orders'), where('status', '==', 'Pending'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPendingOrders(ordersList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching pending orders:", error);
      Alert.alert("Error", "Failed to fetch orders.");
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // 2. Handle Order Completion (Complete/Void)
  const handleUpdateOrderStatus = (orderId, newStatus, orderItems) => {
    Alert.alert(
      `${newStatus} Order?`,
      // FIX 1: Removed order ID from the confirmation message
      `Are you sure you want to set this order as ${newStatus}?`, 
      [
        { text: "Cancel", style: "cancel" },
        { text: newStatus, onPress: async () => {
          try {
            if (newStatus === 'Completed') {
                // DEDUCT INVENTORY BEFORE MARKING AS COMPLETED
                await updateInventory(orderId, orderItems);
                // If inventory deduction succeeds, update order status
                await updateDoc(doc(db, 'orders', orderId), {
                    status: newStatus,
                    completedAt: serverTimestamp(),
                    voidedAt: null,
                });
            } else {
                // Voided status does not affect inventory
                await updateDoc(doc(db, 'orders', orderId), {
                    status: newStatus,
                    completedAt: null,
                    voidedAt: serverTimestamp(),
                });
            }

            // FIX 2: Removed order ID from the success message
            Alert.alert("Success", `Order has been ${newStatus.toLowerCase()}.`);

          } catch (error) {
            console.error(`Error updating order status to ${newStatus}:`, error);
            // Show detailed error if it's an inventory issue
            const errorMessage = error.message.includes('Insufficient stock') 
                ? error.message 
                : `Failed to ${newStatus.toLowerCase()} order. Please try again.`;
            Alert.alert("Error", errorMessage);
          }
        }},
      ]
    );
  };
  
  // 3. Render function for each order item
  const renderOrderItem = ({ item: order }) => {
    const timestamp = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString('en-US') : 'N/A';
    
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          {/* FIX 3: Removed Order ID display from the card */}
          {/* <Text style={styles.orderId}>Order ID: {order.id.substring(0, 8)}</Text> */}
          <View /> {/* Empty view to keep space distributed if needed */}
          <Text style={styles.orderTime}><Ionicons name="time-outline" size={14} color={COLORS.darkGray} /> {timestamp}</Text>
        </View>
        
        <Text style={styles.orderTotal}>Total: {formatPrice(order.totalPrice)}</Text>
        
        {/* Displaying items with category */}
        <View style={styles.itemsContainer}>
            {order.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                    <View style={styles.itemDetails}>
                        <Text style={styles.itemCategoryName}>{item.categoryName}</Text>
                        <Text style={styles.itemName}>{item.quantity}x {item.name} ({item.size})</Text>
                    </View>
                    {item.addons && item.addons.length > 0 && (
                        <Text style={styles.itemAddons}>+{item.addons.map(a => a.name).join(', ')}</Text>
                    )}
                </View>
            ))}
        </View>

        <View style={styles.orderActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleUpdateOrderStatus(order.id, 'Completed', order.items)}
          >
            <Text style={styles.buttonText}>Complete</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.voidButton]}
            onPress={() => handleUpdateOrderStatus(order.id, 'Voided', order.items)} 
          >
            <Text style={styles.buttonText}>Void</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };


  return (
    <SafeAreaView style={globalStyles.container}>
      <Text style={styles.screenTitle}>Pending Orders ({pendingOrders.length})</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loading} />
      ) : (
        <FlatList
          data={pendingOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyMessage}>No pending orders currently.</Text>
          }
        />
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
  listContainer: {
    padding: SIZES.padding,
  },
  loading: {
    flex: 1,
    marginTop: 50,
  },
  emptyMessage: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: FONTS.body.fontSize,
    color: COLORS.darkGray,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  orderTime: {
    fontSize: 14,
    color: COLORS.darkGray,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    paddingBottom: 8,
  },
  // --- Item Display Styles ---
  itemsContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  itemDetails: {
    flexDirection: 'column',
    flex: 1,
  },
  itemCategoryName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary, 
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemName: {
    fontSize: 15,
    color: COLORS.text,
  },
  itemAddons: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.darkGray,
    maxWidth: '50%',
    textAlign: 'right',
  },
  // --- Action Button Styles ---
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#4CAF50', // Green
  },
  voidButton: {
    backgroundColor: COLORS.primary, // Brand Red
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default PendingOrdersScreen;