// mobile-client/ProductModal.js

import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useMenu } from './MenuContext'; 

const formatPrice = (price) => `₱${price.toFixed(2)}`;

const ProductModal = ({ product, onClose, onAddToCart, isVisible }) => {
  const { menu, menuLoading } = useMenu(); 

  // Handle case where menu data is loading
  if (menuLoading || !menu) {
    return (
        <Modal
          animationType="fade"
          transparent={true}
          visible={isVisible}
        >
            <View style={[styles.modalOverlay, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#0052cc" />
            </View>
        </Modal>
    );
  }
  
  const menuAddons = menu?.addons || []; 
  const availableSizes = Object.keys(product.prices);
  
  const [selectedSize, setSelectedSize] = useState(availableSizes[0]);
  // MODIFIED: selectedAddons now stores { id, name, price, quantity: 1 }
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [quantity, setQuantity] = useState(1); 

  const finalPrice = useMemo(() => {
    const basePrice = product.prices[selectedSize];
    
    // MODIFIED: Calculate addonsPrice using individual addon quantity
    const addonsPrice = selectedAddons.reduce((total, addon) => 
        total + (addon.price * addon.quantity)
    , 0);
    
    return (basePrice + addonsPrice) * quantity;
  }, [selectedSize, selectedAddons, quantity, product.prices]);

  const handleAddonQuantityChange = (addon, delta) => {
      setSelectedAddons(prev => {
          const existing = prev.find(a => a.id === addon.id);
          if (!existing) return prev; 

          const newQuantity = Math.max(1, existing.quantity + delta);
          
          return prev.map(a =>
              a.id === addon.id ? { ...a, quantity: newQuantity } : a
          );
      });
  };

  // MODIFIED: Toggles selection and sets default quantity to 1
  const handleAddonToggle = (addon) => {
    setSelectedAddons((prev) => {
      const isSelected = prev.find((a) => a.id === addon.id);
      
      if (isSelected) {
        // Remove addon
        return prev.filter((a) => a.id !== addon.id);
      } else {
        // Add addon with default quantity of 1
        return [...prev, { ...addon, quantity: 1 }];
      }
    });
  };

  const handleIncreaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecreaseQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  const handleSubmit = () => {
    // BUG FIX: Pass the new recipe fields from the product (menu item) into the cart item object
    const customizedProduct = {
      id: product.id,
      name: product.name,
      categoryName: product.categoryName || 'Uncategorized',
      size: selectedSize,
      // MODIFIED: selectedAddons array now correctly contains addon quantity
      addons: selectedAddons, 
      quantity: quantity,
      basePrice: product.prices[selectedSize],
      finalPrice: finalPrice,
      // PASS RECIPE FIELDS DIRECTLY - Fixes missing recipe in order item
      lidType: product.lidType, 
      strawType: product.strawType,
    };
    onClose(); 
    onAddToCart(customizedProduct);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderText}>{product.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseButtonText}>&times;</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {/* Size Selector */}
            {availableSizes.length > 1 && (
              <View style={styles.modalGroup}>
                <Text style={styles.modalGroupTitle}>Size</Text>
                {/* MODIFIED: Size buttons use columns3 to encourage wrapping on smaller screens */}
                <View style={[styles.modalOptionsGrid, styles.columns3]}> 
                  {availableSizes.map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.modalOptionBtnSize, // Use new style for size buttons
                        selectedSize === size && styles.modalOptionBtnActive
                      ]}
                      onPress={() => setSelectedSize(size)}
                    >
                      <Text style={[styles.modalOptionText, selectedSize === size && styles.modalOptionTextActive]}>
                        {size.charAt(0).toUpperCase() + size.slice(1)}
                      </Text>
                      <Text style={[styles.modalOptionPrice, selectedSize === size && styles.modalOptionPriceActive]}>
                        {formatPrice(product.prices[size])}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* ✅ ADD-ONS SELECTOR (Modified for reliable touch area) */}
            {menuAddons.length > 0 && ( 
              <View style={styles.modalGroup}>
                <Text style={styles.modalGroupTitle}>Add-ons</Text>
                <View style={styles.modalOptionsGrid}>
                  {menuAddons.map((addon) => { 
                    // Check if the add-on is currently selected
                    const isSelected = selectedAddons.find(a => a.id === addon.id);
                    const selectedAddon = isSelected ? selectedAddons.find(a => a.id === addon.id) : null;
                    const addonQuantity = selectedAddon?.quantity || 0;
                    
                    return (
                      // FIX: Changed this back to a TouchableOpacity, removed addonTouchArea, and added zIndex
                      <TouchableOpacity 
                        key={addon.id}
                        style={[
                          styles.modalOptionBtnAddon,
                          isSelected && styles.modalOptionBtnActive,
                          { zIndex: 10 } // Ensure high touch priority
                        ]}
                        onPress={() => handleAddonToggle(addon)} // Toggle selection on tap
                        activeOpacity={0.8}
                      >
                          {/* FIX: Ensure addonInfoArea covers all text fields and takes up available space */}
                          <View style={styles.addonInfoArea}>
                              <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextActive]}>
                                {addon.name}
                              </Text>
                              <Text style={[styles.modalOptionPrice, isSelected && styles.modalOptionPriceActive]}>
                                + {formatPrice(addon.price)}
                              </Text>
                          </View>
                          
                          {isSelected ? (
                              // Allow users to adjust quantity by tapping the buttons without toggling the parent selection
                              <View style={styles.addonQuantityControl} onStartShouldSetResponder={() => true}>
                                  {/* Decrement Button */}
                                  <TouchableOpacity
                                      style={styles.addonQuantityButton}
                                      // FIX: Use e.stopPropagation if necessary, but onStartShouldSetResponder is often enough
                                      onPress={(e) => { e.stopPropagation(); handleAddonQuantityChange(addon, -1); }}
                                      disabled={addonQuantity === 1}
                                  >
                                      <Text style={styles.addonQuantityButtonText}>-</Text>
                                  </TouchableOpacity>
                                  
                                  {/* Quantity Display */}
                                  <Text style={styles.addonQuantityText}>{addonQuantity}</Text>
                                  
                                  {/* Increment Button */}
                                  <TouchableOpacity
                                      style={styles.addonQuantityButton}
                                      onPress={(e) => { e.stopPropagation(); handleAddonQuantityChange(addon, 1); }}
                                  >
                                      <Text style={styles.addonQuantityButtonText}>+</Text>
                                  </TouchableOpacity>
                              </View>
                          ) : (
                              // Placeholder for alignment when not selected
                              <View style={styles.addonQuantityControlPlaceholder} /> 
                          )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
            
            {/* Quantity Selector */}
            <View style={styles.modalGroup}>
              <Text style={styles.modalGroupTitle}>Quantity (Product)</Text>
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={handleDecreaseQuantity}
                  disabled={quantity === 1}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <View style={styles.quantityDisplay}>
                  <Text style={styles.quantityText}>{quantity}</Text>
                </View>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={handleIncreaseQuantity}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalAddToCartBtn} onPress={handleSubmit}>
              <Text style={styles.modalAddToCartText}>Add {quantity} to Cart</Text>
              <Text style={styles.modalAddToCartPrice}>{formatPrice(finalPrice)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    width: '90%',
    maxWidth: 680,
    maxHeight: '90%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#dfe1e6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#172b4d',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseButtonText: {
    fontSize: 28,
    color: '#5e6c84',
    lineHeight: 28,
  },
  modalBody: {
    padding: 20,
  },
  modalGroup: {
    marginBottom: 20,
  },
  modalGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#172b4d',
    marginBottom: 12,
  },
  modalOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -6,
  },
  modalOptionBtnSize: {
    flexBasis: '46%', 
    margin: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16, 
    backgroundColor: '#f4f5f7',
    borderWidth: 2,
    borderColor: '#f4f5f7',
    borderRadius: 5,
  },
  // KEY FIX: This is the outer TouchableOpacity container now
  modalOptionBtnAddon: {
    flexBasis: '46%', 
    margin: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8, 
    backgroundColor: '#f4f5f7',
    borderWidth: 2,
    borderColor: '#f4f5f7',
    borderRadius: 5,
  },
  modalOptionBtnActive: {
    backgroundColor: '#e6f0ff',
    borderColor: '#0052cc',
  },
  // NEW: Area for Addon Name/Price, ensures it takes up available space
  addonInfoArea: {
    flex: 1, 
    padding: 8,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#42526e',
  },
  modalOptionTextActive: {
    color: '#0052cc',
    fontWeight: '600',
  },
  modalOptionPrice: {
    fontWeight: '600',
    color: '#42526e',
    fontSize: 13,
    marginTop: 4,
  },
  modalOptionPriceActive: {
    color: '#0052cc',
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#dfe1e6',
    backgroundColor: '#f4f5f7',
  },
  modalAddToCartBtn: {
    width: '100%',
    backgroundColor: '#0065ff',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalAddToCartText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalAddToCartPrice: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Quantity Control Styles
  quantityControl: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#0052cc',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 10,
  },
  quantityButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  quantityDisplay: {
    width: 60,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f5f7',
    borderWidth: 1,
    borderColor: '#dfe1e6',
    borderRadius: 6,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#172b4d',
  },
  // NEW ADDON QUANTITY STYLES
  addonQuantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dfe1e6',
    width: 90, // Fixed width for controls
    height: 35,
    overflow: 'hidden',
    marginLeft: 10,
  },
  addonQuantityControlPlaceholder: {
    width: 90,
    height: 35,
    marginLeft: 10,
  },
  addonQuantityButton: {
    width: 30,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f5f7',
  },
  addonQuantityButtonText: {
    fontSize: 18,
    color: '#0052cc',
    fontWeight: '600',
  },
  addonQuantityText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#172b4d',
  }
});

export default ProductModal;