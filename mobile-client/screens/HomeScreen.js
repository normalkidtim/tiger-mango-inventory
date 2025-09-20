import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

import bannerImage from '../assets/images/flavorbanner1.png';
import mangoCheesecake from '../assets/images/mango-cheesecake.png';
import mangoIceCream from '../assets/images/mango-ice-cream.png';
import mangoPudding from '../assets/images/tiger-combo.png';
import mangoSlush from '../assets/images/mango-chocolate.png';

export default function HomeScreen() {
  const drinks = [
    { name: 'Mango Cheesecake', image: mangoCheesecake },
    { name: 'Mango Ice Cream', image: mangoIceCream },
    { name: 'Mango Pudding', image: mangoPudding },
    { name: 'Mango Slush', image: mangoSlush },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Banner */}
      <Image source={bannerImage} style={styles.banner} resizeMode="cover" />

      {/* Title */}
      <Text style={styles.title}>FLAVORS</Text>

      {/* Drink Cards */}
      <View style={styles.cardsContainer}>
        {drinks.map((drink, index) => (
          <TouchableOpacity key={index} style={styles.card}>
            <Image source={drink.image} style={styles.drinkImage} />
            <Text style={styles.drinkName}>{drink.name}</Text>
            <TouchableOpacity style={styles.orderButton}>
              <Text style={styles.orderText}>ORDER</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  banner: {
    width: '100%',
    height: 200,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 20,
    textAlign: 'center',
  },
  cardsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  drinkImage: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  drinkName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  orderButton: {
    backgroundColor: '#E53935', // Red like your design
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  orderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});