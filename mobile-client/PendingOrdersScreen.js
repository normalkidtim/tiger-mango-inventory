import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  StyleSheet, 
  Alert,
  ActivityIndicator
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
  getFirestore, // Import necessary Firestore tools
  runTransaction,
  getDoc
} from 'firebase/firestore';
import { globalStyles, FONTS, COLORS, SIZES } from './styles';
import { Ionicons } from '@expo/vector-icons';

const formatPrice = (price) => `₱${price.toFixed(2)}`;
const firestore = getFirestore();

// Helper function to format keys like 'large-cup' to 'Large Cup'
const formatKey = (key) => key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
// NEW Helper function to consistently get a category ID from the stored name
const getCategoryId = (name) => name.toLowerCase().replace(/ /g, '-');


// --- DEDUCTION CONSTANTS (Using lowercase, hyphenated category names) ---
const FLAT_LID_CATEGORIES = ['milk-tea', 'iced-coffee', 'fruit-tea', 'soda-series', 'milk-series', 'latte-series', 'non-coffee', 'hot-drinks', 'yogurt-series', 'fruit-tea-yogurt'];
const DOME_LID_CATEGORIES = ['frappe'];

const BOBA_STRAW_CATEGORIES = ['milk-tea', 'fruit-tea', 'milk-series', 'hot-drinks', 'yogurt-series', 'fruit-tea-yogurt'];
const THIN_STRAW_CATEGORIES = ['iced-coffee', 'soda-series', 'latte-series', 'non-coffee'];


// --- INVENTORY DEDUCTION LOGIC ---
const updateInventory = async (orderId, orderItems) => {
    const inventoryRefs = {
        cups: doc(firestore, 'inventory', 'cups'),
        lids: doc(firestore, 'inventory', 'lids'),
        straws: doc(firestore, 'inventory', 'straws'),
        addons: doc(firestore, 'inventory', 'add-ons'),
    };

    const deductions = {
        cups: {},
        lids: { 'flat-lid': 0, 'dome-lid': 0 },
        straws: { 'boba-straw': 0, 'thin-straw': 0 },
        addons: {},
    };

    // 1. Calculate Deductions
    orderItems.forEach(item => {
        const quantity = item.quantity;
        const size = item.size; // 'medium' or 'large'
        
        // **FIXED:** Use categoryName and format it for consistent comparison
        const categoryId = getCategoryId(item.categoryName); 

        // Cup Deduction (Logic unchanged, assumes the Firebase keys are correct: medium-cup, large-cup)
        const cupKey = `${size}-cup`;
        deductions.cups[cupKey] = (deductions.cups[cupKey] || 0) + quantity;

        // Lid Deduction
        if (DOME_LID_CATEGORIES.includes(categoryId)) {
            deductions.lids['dome-lid'] += quantity;
        } else if (FLAT_LID_CATEGORIES.includes(categoryId)) {
            deductions.lids['flat-lid'] += quantity;
        }
        
        // Straw Deduction
        if (BOBA_STRAW_CATEGORIES.includes(categoryId)) {
            deductions.straws['boba-straw'] += quantity;
        } else if (THIN_STRAW_CATEGORIES.includes(categoryId)) {
            deductions.straws['thin-straw'] += quantity;
        }

        // Add-ons Deduction
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

        // Check stock and calculate new stock for Cups
        const newCups = { ...currentCups };
        for (const [key, qty] of Object.entries(deductions.cups)) {
            if ((currentCups[key] || 0) < qty) {
                throw new Error(`Insufficient stock for ${formatKey(key)}.`);
            }
            newCups[key] -= qty;
        }

        // Check stock and calculate new stock for Lids
        const newLids = { ...currentLids };
        for (const [key, qty] of Object.entries(deductions.lids)) {
            if (qty > 0) {
                // Key check is required because 'dome-lid' or 'flat-lid' might not exist in the document yet
                if (currentLids && (currentLids[key] || 0) < qty) {
                    throw new Error(`Insufficient stock for ${formatKey(key)}.`);
                }
                newLids[key] -= qty;
            }
        }
        
        // Check stock and calculate new stock for Straws
        const newStraws = { ...currentStraws };
        for (const [key, qty] of Object.entries(deductions.straws)) {
             if (qty > 0) {
                // Key check is required
                if (currentStraws && (currentStraws[key] || 0) < qty) {
                    throw new Error(`Insufficient stock for ${formatKey(key)}.`);
                }
                newStraws[key] -= qty;
             }
        }

        // Check stock and calculate new stock for Add-ons
        const newAddons = { ...currentAddons };
        for (const [key, qty] of Object.entries(deductions.addons)) {
            // Key check is required
            if (currentAddons && (currentAddons[key] || 0) < qty) {
                throw new Error(`Insufficient stock for ${formatKey(key)}.`);
            }
            newAddons[key] -= qty;
        }

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
      `Are you sure you want to set order ${orderId.substring(0, 5)}... as ${newStatus}?`,
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

            Alert.alert("Success", `Order ${orderId.substring(0, 5)}... has been ${newStatus.toLowerCase()}.`);

          } catch (error) {
            console.error(`Error updating order status to ${newStatus}:`, error);
            // Show detailed error if it's an inventory issue
            const errorMessage = error.message.includes('Insufficient stock') 
                ? error.message 
                : `Failed to ${newStatus.toLowerCase()} order. Please check the console.`;
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
          <Text style={styles.orderId}>Order ID: {order.id.substring(0, 8)}</Text>
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