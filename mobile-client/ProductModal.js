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
import { useMenu } from './MenuContext'; // Using the MenuContext for live data

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
  
  // Safely get add-ons from the loaded menu data
  // Note: This relies on your Firebase config/menu document having the "addons" key.
  const menuAddons = menu?.addons || []; 

  const availableSizes = Object.keys(product.prices);
  
  const [selectedSize, setSelectedSize] = useState(availableSizes[0]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [quantity, setQuantity] = useState(1); 

  const finalPrice = useMemo(() => {
    const basePrice = product.prices[selectedSize];
    const addonsPrice = selectedAddons.reduce((total, addon) => total + addon.price, 0);
    return (basePrice + addonsPrice) * quantity;
  }, [selectedSize, selectedAddons, quantity, product.prices]);

  const handleAddonToggle = (addon) => {
    setSelectedAddons((prev) =>
      prev.find((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const handleIncreaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecreaseQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  const handleSubmit = () => {
    const customizedProduct = {
      id: product.id,
      name: product.name,
      categoryName: product.categoryName || 'Uncategorized',
      size: selectedSize,
      addons: selectedAddons,
      quantity: quantity,
      basePrice: product.prices[selectedSize],
      finalPrice: finalPrice,
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
                <View style={styles.modalOptionsGrid}>
                  {availableSizes.map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.modalOptionBtn, 
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

            {/* ✅ ADD-ONS SELECTOR (This section is guaranteed to be rendered correctly now) */}
            {menuAddons.length > 0 && ( 
              <View style={styles.modalGroup}>
                <Text style={styles.modalGroupTitle}>Add-ons</Text>
                <View style={styles.modalOptionsGrid}>
                  {menuAddons.map((addon) => { 
                    // Check if the add-on is currently selected
                    const isActive = selectedAddons.find(a => a.id === addon.id);
                    return (
                      <TouchableOpacity
                        key={addon.id}
                        style={[
                          styles.modalOptionBtn, 
                          isActive && styles.modalOptionBtnActive
                        ]}
                        onPress={() => handleAddonToggle(addon)}
                      >
                        <Text style={[styles.modalOptionText, isActive && styles.modalOptionTextActive]}>
                          {addon.name}
                        </Text>
                        <Text style={[styles.modalOptionPrice, isActive && styles.modalOptionPriceActive]}>
                          + {formatPrice(addon.price)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
            
            {/* Quantity Selector */}
            <View style={styles.modalGroup}>
              <Text style={styles.modalGroupTitle}>Quantity</Text>
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
  columns3: {
    // This is handled by flexWrap, but you could adjust child basis if needed
  },
  modalOptionBtn: {
    flexBasis: '46%', // Two columns with gap
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
  modalOptionBtnSingle: {
    justifyContent: 'center',
  },
  modalOptionBtnActive: {
    backgroundColor: '#e6f0ff',
    borderColor: '#0052cc',
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
});

export default ProductModal;