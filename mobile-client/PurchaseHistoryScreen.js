import React, { useEffect, useState, useMemo } from 'react';
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
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { globalStyles, FONTS, COLORS, SIZES } from './styles';
import { Ionicons } from '@expo/vector-icons';

const formatPrice = (price) => `₱${price.toFixed(2)}`;

const PurchaseHistoryScreen = () => {
  const [allHistoryOrders, setAllHistoryOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All'); 
  const [loading, setLoading] = useState(true);

  // 1. Fetch all completed/voided orders
  useEffect(() => {
    // Fetch ALL orders ordered by creation time, descending
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Filter the base list to only include non-pending orders (Completed or Voided)
      const nonPendingOrders = allOrders.filter(
        order => order.status === 'Completed' || order.status === 'Voided'
      );

      setAllHistoryOrders(nonPendingOrders);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching history orders:", error);
      Alert.alert("Error", "Failed to fetch purchase history.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Filter the displayed orders based on the selected status
  const filteredHistory = useMemo(() => {
    if (filterStatus === 'All') {
      return allHistoryOrders;
    }
    return allHistoryOrders.filter(order => order.status === filterStatus);
  }, [allHistoryOrders, filterStatus]);


  const renderHistoryItem = ({ item: order }) => {
    const timestamp = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-US') : 'N/A';
    const time = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString('en-US') : '';
    
    const statusStyle = order.status === 'Voided' ? styles.voidStatus : styles.completedStatus;
    const statusIcon = order.status === 'Voided' ? 'alert-circle-outline' : 'checkmark-circle-outline';
    

    return (
      <View style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.statusBadge}>
             <Ionicons name={statusIcon} size={16} color={statusStyle.color} />
             <Text style={[styles.statusText, statusStyle]}>{order.status}</Text>
          </View>
          <Text style={styles.timestamp}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.darkGray} /> {timestamp} {time}
          </Text>
        </View>
        
        <View style={styles.contentRow}>
            <Text style={styles.orderTotalText}>Total Price:</Text>
            <Text style={styles.orderTotalValue}>{formatPrice(order.totalPrice)}</Text>
        </View>

        {/* START: Displaying items with Category Name */}
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
        {/* END: Displaying items with Category Name */}
      </View>
    );
  };

  const FilterButton = ({ status, label }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterStatus === status && styles.filterButtonActive
      ]}
      onPress={() => setFilterStatus(status)}
    >
      <Text style={[
          styles.filterButtonText,
          filterStatus === status && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <Text style={styles.screenTitle}>Purchase History ({filteredHistory.length})</Text>
      
      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <FilterButton status="All" label="All" />
        <FilterButton status="Completed" label="Completed" />
        <FilterButton status="Voided" label="Voided" />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loading} />
      ) : (
        <FlatList
          data={filteredHistory}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyMessage}>
                {filterStatus === 'All' 
                    ? 'No completed or voided purchases found.' 
                    : `No ${filterStatus.toLowerCase()} purchases found.`
                }
            </Text>
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
    paddingBottom: 10,
    textAlign: 'center',
  },
  // --- Filter Bar Styles ---
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SIZES.padding,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
    marginBottom: SIZES.padding,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary, // Highlight active button
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  // --- List/Card Styles ---
  listContainer: {
    paddingHorizontal: SIZES.padding,
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
  historyCard: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    paddingBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  completedStatus: {
    color: '#4CAF50', // Green
  },
  voidStatus: {
    color: COLORS.primary, // Red
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.darkGray,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 5,
      marginTop: 5,
  },
  orderTotalText: {
      fontSize: 16,
      fontWeight: '500',
      color: COLORS.text,
  },
  orderTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  // --- Item Display Styles (Copied from PendingOrdersScreen for consistency) ---
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
    color: '#0052cc', // Use a standard blue for category for contrast
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
});

export default PurchaseHistoryScreen;