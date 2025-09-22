import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function MenuScreen({ navigation }) {
  const menuItems = Object.keys(drinks);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("OrderScreen", { selectedFlavor: item })}
    >
      <Image source={drinks[item]} style={styles.cardImage} />
      <Text style={styles.cardTitle}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#E53935" />
      <Text style={styles.title}>Our Menu</Text>
      <FlatList
        data={menuItems}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E53935", // Red background
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 16,
  },
  list: {
    paddingBottom: 80,
  },
  row: {
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    elevation: 3, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
});
