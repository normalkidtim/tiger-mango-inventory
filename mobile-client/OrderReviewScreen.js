import React, { useState, useEffect } from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet, StatusBar, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, updateDoc, increment, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { Feather } from '@expo/vector-icons'; // ✅ Use the correct, built-in icon library
import { COLORS, SIZES, FONTS, globalStyles } from './styles';

// ... (keep the `drinks` and `firebaseAddonKeys` constants)
const drinks = {
  "Mango Cheesecake": require("./assets/images/mango-cheesecake.png"),
  "Mango Ice Cream": require("./assets/images/mango-ice-cream.png"),
  "Mango Strawberry": require("./assets/images/mango-strawberry.png"),
  "Tiger Combo": require("./assets/images/tiger-combo.png"),
  "Mango Chocolate": require("./assets/images/mango-chocolate.png"),
  "Mango Banana": require("./assets/images/mango-banana.png"),
  "Mango Cashews": require("./assets/images/mango-cashews.png"),
  "Mango Chips": require("./assets/images/mango-chips.png"),
  "Mango Graham": require("./assets/images/mango-graham.png"),
};
const firebaseAddonKeys = {
  "Pearl": "pearl", "Crushed Grahams": "crushed-grahams", "Oreo Crumble": "oreo-crumble",
  "Oreo Grahams": "oreo-grahams", "Strawberry Syrup": "strawberry-syrup",
  "Chocolate Syrup": "chocolate-syrup", "Sliced Mango": "sliced-mango", "Ice Cream": "ice-cream",
};

export default function OrderReviewScreen({ route, navigation }) {
  const { items: initialItems } = route.params || {};
  const [items, setItems] = useState(initialItems || []);

  useEffect(() => {
    if (route.params?.items) {
      setItems(route.params.items);
    }
  }, [route.params?.items]);

  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.price, 0);
  };

  const handleDelete = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleProceed = async () => {
    if (items.length === 0) {
      Alert.alert("Empty Cart", "Please add items to your order before proceeding.");
      return;
    }

    try {
      const addonsSnap = await getDoc(doc(db, "inventory", "add-ons"));
      const currentAddons = addonsSnap.data();

      for (let item of items) {
        if (item.addOns && item.addOns.length > 0) {
          for (let addOn of item.addOns) {
            const dbKey = firebaseAddonKeys[addOn];
            if (dbKey && (currentAddons[dbKey] || 0) < item.quantity) {
              Alert.alert("Out of Stock", `Sorry, we don't have enough ${addOn} for your order.`);
              return;
            }
          }
        }
      }

      for (let item of items) {
        const cupField = item.size === "1LITER" ? "liter" : (item.size === "GRANDE" ? "grande" : "tall");
        const strawField = item.size === "1LITER" ? "big" : "regular";

        await updateDoc(doc(db, "inventory", "cups"), { [cupField]: increment(-item.quantity) });
        await updateDoc(doc(db, "inventory", "straw"), { [strawField]: increment(-item.quantity) });

        if (item.addOns && item.addOns.length > 0) {
          for (let addOn of item.addOns) {
            const dbKey = firebaseAddonKeys[addOn];
            if (dbKey) await updateDoc(doc(db, "inventory", "add-ons"), { [dbKey]: increment(-item.quantity) });
          }
        }

        await addDoc(collection(db, "orders"), {
          flavor: item.flavor, size: item.size, addOns: item.addOns,
          quantity: item.quantity, price: item.price, notes: item.notes || "",
          createdAt: serverTimestamp(),
        });
      }

      Alert.alert("Success!", "Your order has been placed.");
      navigation.navigate("Home");
    } catch (error) {
      console.error("Firestore update error:", error);
      Alert.alert("Error", "Something went wrong while placing your order.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <Image source={drinks[item.flavor]} style={styles.drinkImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.flavorText}>{item.flavor}</Text>
        <Text style={styles.detailText}>Size: {item.size} • Qty: {item.quantity}</Text>
        {item.addOns.length > 0 && <Text style={styles.detailText}>Add-ons: {item.addOns.join(", ")}</Text>}
      </View>
      <View style={{alignItems: 'flex-end'}}>
        <Text style={styles.priceText}>₱{item.price}</Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             {/* ✅ Use the correct icon component */}
            <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Your Order</Text>
      </View>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: SIZES.padding }}
        ListEmptyComponent={<Text style={styles.emptyText}>Your cart is empty.</Text>}
      />
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceValue}>₱{calculateTotal()}</Text>
        </View>
        <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
          <Text style={styles.proceedButtonText}>Place Order Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: SIZES.padding, alignItems: 'center', flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.gray },
  backButton: { position: 'absolute', left: SIZES.padding, zIndex: 1 },
  title: { ...FONTS.h2, textAlign: 'center', flex: 1 },
  emptyText: { ...FONTS.body, color: COLORS.darkGray, textAlign: 'center', marginTop: 50 },
  orderItem: {
    flexDirection: "row", backgroundColor: COLORS.white, borderRadius: 16, padding: 15,
    marginBottom: 15, alignItems: "center",
  },
  drinkImage: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
  itemDetails: { flex: 1 },
  flavorText: { ...FONTS.h3, fontSize: 18, marginBottom: 4 },
  detailText: { ...FONTS.body, color: COLORS.darkGray, fontSize: 14 },
  priceText: { ...FONTS.h3, color: COLORS.primary },
  deleteText: { ...FONTS.body, color: COLORS.primary, fontSize: 14, marginTop: 4 },
  footer: { padding: SIZES.padding, borderTopWidth: 1, borderTopColor: COLORS.gray, backgroundColor: COLORS.white },
  priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  priceLabel: { ...FONTS.body, color: COLORS.darkGray },
  priceValue: { ...FONTS.h2 },
  proceedButton: { backgroundColor: COLORS.primary, padding: 20, borderRadius: 30, alignItems: 'center' },
  proceedButtonText: { ...FONTS.h3, color: COLORS.white, fontSize: 18 },
});