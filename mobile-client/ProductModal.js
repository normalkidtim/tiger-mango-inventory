import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  ScrollView 
} from 'react-native';
import { menuData } from './menuData';

const formatPrice = (price) => `₱${price.toFixed(2)}`;

const ProductModal = ({ product, onClose, onAddToCart, isVisible }) => {
  const availableSizes = Object.keys(product.prices);
  
  const [selectedSize, setSelectedSize] = useState(availableSizes[0]);
  const [selectedSugar, setSelectedSugar] = useState(menuData.options.sugar[1]);
  const [selectedIce, setSelectedIce] = useState(menuData.options.ice[0]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [quantity, setQuantity] = useState(1); // Quantity is fixed at 1 for now

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

  const handleSubmit = () => {
    const customizedProduct = {
      id: product.id,
      name: product.name,
      categoryName: product.categoryName || 'Uncategorized',
      size: selectedSize,
      sugar: selectedSugar,
      ice: selectedIce,
      addons: selectedAddons,
      quantity: quantity,
      basePrice: product.prices[selectedSize],
      finalPrice: finalPrice,
    };
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

            <View style={styles.modalGroup}>
              <Text style={styles.modalGroupTitle}>Sugar Level</Text>
              <View style={styles.modalOptionsGrid}>
                {menuData.options.sugar.map((sugar) => (
                  <TouchableOpacity
                    key={sugar}
                    style={[
                      styles.modalOptionBtn, 
                      styles.modalOptionBtnSingle,
                      selectedSugar === sugar && styles.modalOptionBtnActive
                    ]}
                    onPress={() => setSelectedSugar(sugar)}
                  >
                    <Text style={[styles.modalOptionText, selectedSugar === sugar && styles.modalOptionTextActive]}>
                      {sugar}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalGroup}>
              <Text style={styles.modalGroupTitle}>Ice Level</Text>
              <View style={[styles.modalOptionsGrid, styles.columns3]}>
                {menuData.options.ice.map((ice) => (
                  <TouchableOpacity
                    key={ice}
                    style={[
                      styles.modalOptionBtn, 
                      styles.modalOptionBtnSingle,
                      selectedIce === ice && styles.modalOptionBtnActive
                    ]}
                    onPress={() => setSelectedIce(ice)}
                  >
                    <Text style={[styles.modalOptionText, selectedIce === ice && styles.modalOptionTextActive]}>
                      {ice}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalGroup}>
              <Text style={styles.modalGroupTitle}>Add-ons</Text>
              <View style={styles.modalOptionsGrid}>
                {menuData.addons.map((addon) => {
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
          </ScrollView>

          <View style={styles.modalFooter}>
            {/* Quantity controls could go here */}
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
  }
});

export default ProductModal;