import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView, 
  StyleSheet, 
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

import { useMenu } from './MenuContext'; 
import ProductModal from './ProductModal';

// Helper function to format prices
const formatPrice = (price) => `₱${price.toFixed(2)}`;

const POSScreen = () => {
  const navigation = useNavigation();
  const { menu, menuLoading } = useMenu(); 

  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  // Set initial category once menu data is loaded
  React.useEffect(() => {
    if (!menuLoading && menu?.categories?.length && !activeCategory) {
        setActiveCategory(menu.categories[0].id);
    }
  }, [menu, menuLoading, activeCategory]);


  // UPDATED: Use menu from context with safe access
  const foundCategory = (menu?.categories || []).find(
    (cat) => cat.id === activeCategory
  );
  
  const activeProducts = foundCategory ? foundCategory.products : [];
  const activeCategoryName = foundCategory ? foundCategory.name : 'Uncategorized';

  const handleProductClick = (product, categoryName) => {
    setSelectedProduct({ ...product, categoryName: categoryName });
    setIsProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAddToCart = (customizedProduct) => {
    const cartId = `${customizedProduct.id}-${new Date().getTime()}`;
    setCart([...cart, { ...customizedProduct, cartId }]);
    handleCloseProductModal();
  };

  const handleRemoveFromCart = (cartId) => {
    setCart(cart.filter((item) => item.cartId !== cartId));
  };

  const cartTotal = useMemo(() => 
    cart.reduce((total, item) => total + item.finalPrice, 0)
  , [cart]);
  
  const cartItemCount = useMemo(() =>
    cart.reduce((total, item) => total + item.quantity, 0)
  , [cart]);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      Alert.alert("Cart is empty!");
      return;
    }
    if (isPlacingOrder) return;

    setIsPlacingOrder(true);

    try {
      const newOrder = {
        items: cart.map(({ cartId, ...rest }) => rest), // Remove cartId before saving to DB
        totalPrice: cartTotal,
        createdAt: serverTimestamp(),
        status: 'Pending', 
      };

      await addDoc(collection(db, 'orders'), newOrder);

      Alert.alert(
        `Order Placed!`, 
        `Total: ${formatPrice(cartTotal)}`,
        [
          { text: "View Pending Orders", onPress: () => navigation.navigate('PendingOrders') },
          { text: "New Order", onPress: () => {} },
        ]
      );
      setCart([]);
      setIsCartModalOpen(false);
    } catch (error) {
      console.error("Error placing order: ", error);
      Alert.alert("Error", "Failed to place the order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // --- Render Functions for Lists ---

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        activeCategory === item.id && styles.categoryButtonActive,
      ]}
      onPress={() => setActiveCategory(item.id)}
    >
      <Text
        style={[
          styles.categoryButtonText,
          activeCategory === item.id && styles.categoryButtonTextActive,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }) => {
    const hasMediumPrice = typeof item.prices.medium === 'number';
    const hasLargePrice = typeof item.prices.large === 'number';
    let priceText = '';

    if (hasMediumPrice && hasLargePrice) {
      priceText = `${formatPrice(item.prices.medium)} - ${formatPrice(item.prices.large)}`;
    } else if (hasMediumPrice) {
      priceText = formatPrice(item.prices.medium);
    } else if (hasLargePrice) {
      priceText = formatPrice(item.prices.large);
    } else {
      priceText = formatPrice(0);
    }

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductClick(item, activeCategoryName)}
      >
        <Text style={styles.productCardName}>{item.name}</Text>
        <Text style={styles.productCardPrice}>{priceText}</Text>
      </TouchableOpacity>
    );
  };
  
  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemDetails}>
        <Text style={styles.cartItemName}>
          {item.quantity}x {item.name} ({item.size})
        </Text>
        <Text style={styles.cartItemCategory}>{item.categoryName}</Text>
        {/* REMOVED: Sugar and Ice display from cart item */}
        {item.addons.length > 0 && (
          <Text style={styles.cartItemAddons}>
            + {item.addons.map(a => a.name).join(', ')}
          </Text>
        )}
      </View>
      <View style={styles.cartItemActions}>
        <Text style={styles.cartItemPrice}>{formatPrice(item.finalPrice)}</Text>
        <TouchableOpacity 
          style={styles.cartItemRemove}
          onPress={() => handleRemoveFromCart(item.cartId)}
        >
          <Text style={styles.cartItemRemoveText}>&times;</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (menuLoading || !menu) { 
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0052cc" />
                <Text style={styles.loadingText}>Loading menu...</Text>
            </View>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={handleCloseProductModal}
          onAddToCart={handleAddToCart}
          isVisible={isProductModalOpen}
        />
      )}

      {/* Cart Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCartModalOpen}
        onRequestClose={() => setIsCartModalOpen(false)}
      >
        <View style={styles.cartModalOverlay}>
          <View style={styles.cartModalContent}>
            <View style={styles.cartModalHeader}>
              <Text style={styles.cartTitle}>Current Order</Text>
              <TouchableOpacity onPress={() => setIsCartModalOpen(false)} style={styles.cartModalCloseButton}>
                <Text style={styles.cartModalCloseButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={cart}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.cartId}
              style={styles.cartItemsList}
              ListEmptyComponent={
                <View style={styles.cartEmptyContainer}>
                  <Text style={styles.cartEmptyMessage}>Your cart is empty.</Text>
                </View>
              }
            />
            
            <View style={styles.cartSummary}>
              <View style={styles.cartTotal}>
                <Text style={styles.cartTotalText}>Total</Text>
                <Text style={styles.cartTotalText}>{formatPrice(cartTotal)}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.cartPayButton, (cart.length === 0 || isPlacingOrder) && styles.cartPayButtonDisabled]} 
                onPress={handlePlaceOrder}
                disabled={cart.length === 0 || isPlacingOrder}
              >
                <Text style={styles.cartPayButtonText}>
                  {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category List */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={menu?.categories || []} // This usage is fine
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Product Grid */}
      <FlatList
        data={activeProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        style={styles.productGrid}
        contentContainerStyle={styles.productGridContent}
        ListEmptyComponent={
          <Text style={styles.cartEmptyMessage}>No products in this category.</Text>
        }
      />
      
      {/* Cart Footer Button */}
      <View style={styles.cartFooter}>
        <TouchableOpacity 
          style={styles.cartFooterButton}
          onPress={() => setIsCartModalOpen(true)}
        >
          <Text style={styles.cartFooterButtonText}>
            View Cart ({cartItemCount})
          </Text>
          <Text style={styles.cartFooterButtonText}>
            {formatPrice(cartTotal)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f7',
  },
  loadingContainer: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  loadingText: {
    marginTop: 10,
    color: '#5e6c84',
    fontSize: 16,
  },
  // Categories
  categoriesContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dfe1e6',
  },
  categoriesList: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f4f5f7',
    marginHorizontal: 4,
  },
  categoryButtonActive: {
    backgroundColor: '#0052cc',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#42526e',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  // Products
  productGrid: {
    flex: 1,
  },
  productGridContent: {
    padding: 16,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dfe1e6',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    justifyContent: 'space-between',
    minHeight: 100,
  },
  productCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#172b4d',
    marginBottom: 8,
  },
  productCardPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5e6c84',
  },
  // Cart Footer Button
  cartFooter: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#dfe1e6',
  },
  cartFooterButton: {
    backgroundColor: '#0065ff',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartFooterButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Cart Modal
  cartModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  cartModalContent: {
    backgroundColor: '#ffffff',
    height: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  cartModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#dfe1e6',
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#172b4d',
  },
  cartModalCloseButton: {
    padding: 5,
  },
  cartModalCloseButtonText: {
    fontSize: 16,
    color: '#0052cc',
    fontWeight: '600',
  },
  cartItemsList: {
    flex: 1, // Allows list to scroll
  },
  cartEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  cartEmptyMessage: {
    textAlign: 'center',
    color: '#5e6c84',
    fontSize: 16,
  },
  // Cart Item
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f5f7',
  },
  cartItemDetails: {
    flex: 1,
    gap: 4,
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#172b4d',
  },
  cartItemCategory: {
    fontSize: 13,
    color: '#5e6c84',
  },
  // REMOVED: cartItemMods style rule
  cartItemAddons: {
    fontSize: 13,
    color: '#5e6c84',
    fontStyle: 'italic',
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginLeft: 10,
  },
  cartItemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#172b4d',
    marginTop: 2,
  },
  cartItemRemove: {
    backgroundColor: '#f4f5f7',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemRemoveText: {
    color: '#5e6c84',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  // Cart Summary (in Modal)
  cartSummary: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#dfe1e6',
    backgroundColor: '#f4f5f7',
  },
  cartTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cartTotalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#172b4d',
  },
  cartPayButton: {
    width: '100%',
    padding: 16,
    backgroundColor: '#0065ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  cartPayButtonDisabled: {
    backgroundColor: '#a5adba',
  },
  cartPayButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default POSScreen;