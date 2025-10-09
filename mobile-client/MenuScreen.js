import React from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SIZES, FONTS, globalStyles } from './styles';

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
      <View style={styles.plusButton}>
        <Text style={styles.plusText}>+</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={{ paddingHorizontal: SIZES.padding }}>
        <Text style={styles.title}>Our Menu</Text>
      </View>
      <FlatList
        data={menuItems}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingHorizontal: SIZES.padding }}
      />
    </SafeAreaView>
  );
}

const styles = {
  title: { ...FONTS.h1, textAlign: "center", marginBottom: SIZES.padding },
  row: { justifyContent: "space-between" },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: SIZES.padding,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardImage: { width: 120, height: 120, resizeMode: "contain", marginBottom: 12 },
  cardTitle: { ...FONTS.body, fontWeight: "600", textAlign: "center" },
  plusButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 30,
    height: 30,
    backgroundColor: COLORS.accent,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    fontSize: 20,
    color: COLORS.text,
  }
};