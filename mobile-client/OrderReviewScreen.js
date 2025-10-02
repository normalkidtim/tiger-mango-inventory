import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, updateDoc, increment, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// ✅ Drink images
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

// ✅ CORRECTED: Map from display names to Firebase keys
const firebaseAddonKeys = {
  "Pearl": "pearl",
  "Crushed Grahams": "crushed-grahams", 
  "Oreo Crumble": "oreo-crumble",
  "Oreo Grahams": "oreo-grahams",
  "Strawberry Syrup": "strawberry-syrup",
  "Chocolate Syrup": "chocolate-syrup",
  "Sliced Mango": "sliced-mango",
  "Ice Cream": "ice-cream",
};

export default function OrderReviewScreen({ route, navigation }) {
  const { items: initialItems } = route.params || {};
  const [items, setItems] = useState(initialItems || []);

  useEffect(() => {
    if (initialItems) {
      setItems(initialItems);
    }
  }, [initialItems]);

  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.price, 0);
  };

  const handleDelete = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEdit = (itemToEdit) => {
    Alert.alert("Edit feature coming soon!");
  };

  // ✅ FIXED: Proceed button now saves orders to Firestore
  const handleProceed = async () => {
    try {
      // ✅ FIRST: Check ALL inventory BEFORE deducting anything
      const addonsSnap = await getDoc(doc(db, "inventory", "add-ons"));
      const currentAddons = addonsSnap.data();

      // Check if we have enough stock for ALL items first
      for (let item of items) {
        if (item.addOns && item.addOns.length > 0) {
          for (let addOn of item.addOns) {
            const dbKey = firebaseAddonKeys[addOn]; // Get the Firestore key

            if (dbKey) {
              const subtractAmount = item.quantity;
              const current = currentAddons[dbKey] || 0;

              if (current < subtractAmount) {
                Alert.alert("Error", `Not enough ${addOn} in stock. Available: ${current}, Needed: ${subtractAmount}`);
                return; // Stop here before deducting anything
              }
            } else {
              Alert.alert("Error", `Invalid add-on: ${addOn}`);
              return;
            }
          }
        }
      }

      // ✅ SECOND: Only if ALL checks pass, deduct inventory AND save orders
      for (let item of items) {
        let cupField = "";
        let strawField = "";

        // ✅ Select correct cup & straw
        if (item.size === "TALL") {
          cupField = "tall";
          strawField = "regular";
        }
        if (item.size === "GRANDE") {
          cupField = "grande";
          strawField = "regular";
        }
        if (item.size === "1LITER") {
          cupField = "liter";
          strawField = "big";
        }

        // ✅ Update cups
        if (cupField) {
          await updateDoc(doc(db, "inventory", "cups"), {
            [cupField]: increment(-item.quantity),
          });
        }

        // ✅ Update straws
        if (strawField) {
          await updateDoc(doc(db, "inventory", "straw"), {
            [strawField]: increment(-item.quantity),
          });
        }

        // ✅ Update add-ons (subtract per quantity)
        if (item.addOns && item.addOns.length > 0) {
          for (let addOn of item.addOns) {
            const dbKey = firebaseAddonKeys[addOn];
            
            if (dbKey) {
              await updateDoc(doc(db, "inventory", "add-ons"), {
                [dbKey]: increment(-item.quantity),
              });
            }
          }
        }

        // ✅ SAVE ORDER TO FIRESTORE (This was missing!)
        await addDoc(collection(db, "orders"), {
          flavor: item.flavor,
          size: item.size,
          addOns: item.addOns,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || "",
          createdAt: serverTimestamp(),
        });
      }

      Alert.alert("Success", "Order placed and inventory updated!");
      navigation.navigate("Home");
    } catch (error) {
      console.error("Firestore update error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <Image source={drinks[item.flavor]} style={styles.drinkImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.flavorText}>{item.flavor}</Text>
        <Text style={styles.detailText}>Size: {item.size}</Text>
        {item.addOns.length > 0 && (
          <Text style={styles.detailText}>
            Add-ons: {item.addOns.join(", ")}
          </Text>
        )}
        <Text style={styles.detailText}>Quantity: {item.quantity}</Text>
        <Text style={styles.priceText}>₱{item.price}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEdit(item)}
        >
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent={true} backgroundColor="transparent" />

      <View style={styles.header}>
        <Text style={styles.title}>Order Review</Text>
        <Text style={styles.totalText}>Total: ₱{calculateTotal()}</Text>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No items yet. Add your first drink!</Text>
        }
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={() => navigation.navigate("OrderScreen", { items: items })}
        >
          <Text style={styles.buttonText}>← Add More Drinks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.proceedButton]}
          onPress={handleProceed}
        >
          <Text style={styles.buttonText}>Proceed</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E53935", padding: 16 },
  header: { alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "white" },
  totalText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFD700",
    marginTop: 8,
  },
  list: { flex: 1 },
  emptyText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  orderItem: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  drinkImage: { width: 80, height: 80, borderRadius: 8, marginRight: 16 },
  itemDetails: { flex: 1 },
  flavorText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  detailText: { fontSize: 14, color: "#666", marginBottom: 4 },
  priceText: { fontSize: 20, fontWeight: "bold", color: "#E53935" },
  actionButtons: { marginLeft: 16, alignItems: "center" },
  editButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: "#E53935",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionText: { fontSize: 12, fontWeight: "bold", color: "black" },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 8,
  },
  backButton: { backgroundColor: "#333" },
  proceedButton: { backgroundColor: "#FFD700" },
  buttonText: { fontSize: 16, fontWeight: "bold", color: "white" },
});