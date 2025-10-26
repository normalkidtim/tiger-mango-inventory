import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONTS, globalStyles } from './styles';
import { db } from "./firebase";
// We only need collection, addDoc, and serverTimestamp
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; 

export default function OrderReviewScreen({ navigation, route }) {
    const { items } = route.params;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalOrderPrice = items.reduce((total, item) => total + item.price, 0);

    const handleConfirmOrder = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            // All inventory transaction logic has been REMOVED from this function.
            // We are only creating the new order document.
            
            const newOrder = {
                items: items, 
                totalPrice: totalOrderPrice,
                createdAt: serverTimestamp(),
                status: 'Pending' // Set status to 'Pending'
            };
            
            // Add the single order document to the 'orders' collection
            await addDoc(collection(db, 'orders'), newOrder);

            Alert.alert('Order Confirmed', 'Your order has been placed successfully!');
            navigation.navigate('Menu');

        } catch (error) {
            console.error("Failed to place order:", error);
            Alert.alert('Order Failed', error.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review Your Order</Text>
            </View>

            <ScrollView contentContainerStyle={styles.listContainer}>
                {items.map((item) => (
                    <View key={item.id} style={styles.itemCard}>
                        <View style={styles.itemDetails}>
                            <Text style={styles.itemFlavor}>{item.quantity}x {item.flavor}</Text>
                            <Text style={styles.itemSize}>{item.size}</Text>
                            {item.addOns.length > 0 && (
                                <Text style={styles.itemAddOns}>
                                    Add-ons: {item.addOns.join(', ')}
                                </Text>
                            )}
                        </View>
                        <Text style={styles.itemPrice}>₱{item.price}</Text>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Total Price</Text>
                    <Text style={styles.priceValue}>₱{totalOrderPrice}</Text>
                </View>
                <TouchableOpacity 
                    style={[styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]} 
                    onPress={handleConfirmOrder}
                    disabled={isSubmitting}
                >
                    <Text style={styles.confirmButtonText}>
                        {isSubmitting ? 'Placing Order...' : 'Confirm Order'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
    backButton: { marginRight: 20 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
    listContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 150 },
    itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    itemDetails: { flex: 1 },
    itemFlavor: { fontSize: 18, fontWeight: '600', color: '#111' },
    itemSize: { fontSize: 14, color: '#555', marginTop: 4 },
    itemAddOns: { fontSize: 14, color: '#555', marginTop: 4, fontStyle: 'italic' },
    itemPrice: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: 15, paddingHorizontal: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EAEAEA' },
    priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    priceLabel: { fontSize: 16, color: '#666' },
    priceValue: { fontSize: 26, fontWeight: 'bold', color: '#111' },
    confirmButton: { backgroundColor: '#E53935', paddingVertical: 18, borderRadius: 30, alignItems: 'center', elevation: 3 },
    confirmButtonDisabled: { backgroundColor: '#BDBDBD' },
    confirmButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});