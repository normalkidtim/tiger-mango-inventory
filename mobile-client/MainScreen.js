import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth'; 
import { COLORS, SIZES, FONTS, globalStyles } from './styles'; 
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'; 

const { width } = Dimensions.get('window');
const BUTTON_SIZE = (width - SIZES.padding * 3) / 2;

const MenuButton = ({ title, iconName, color, onPress }) => (
  <TouchableOpacity
    style={[styles.button, { backgroundColor: color }]}
    onPress={onPress}
  >
    <Ionicons name={iconName} size={40} color={COLORS.white} />
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

const MainScreen = ({ userProfile }) => {
  const navigation = useNavigation();
  const auth = getAuth(); 

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
      Alert.alert("Logout Error", "Failed to sign out. Please try again.");
    }
  };
  
  const userName = userProfile?.fullName || 'Staff Member';


  return (
    <RNSafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      
      {/* Content Wrapper using ScrollView */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Dashboard Header */}
        <Text style={styles.header}>Dashboard</Text>
        
        {/* Menu Grid */}
        <View style={styles.grid}>
          <MenuButton
            title="Take Order"
            iconName="cart"
            color="#E53935" 
            onPress={() => navigation.navigate('TakeOrder')}
          />
          <MenuButton
            title="Pending Orders"
            iconName="time"
            color="#FFD700" 
            onPress={() => navigation.navigate('PendingOrders')}
          />
          <MenuButton
            title="Purchase History"
            iconName="list-circle"
            color="#388E3C" 
            onPress={() => navigation.navigate('PurchaseHistory')}
          />
          <MenuButton
            title="Inventory"
            iconName="cube"
            color="#1976D2" 
            onPress={() => navigation.navigate('Inventory')}
          />
        </View>
        
        {/* NEW POSITION: Name/Welcome Message in the flow, aligned right */}
        <View style={styles.welcomeWrapper}>
            <Text style={styles.welcomeText}>Hello, {userName}</Text> 
        </View>

        {/* Logout Button is positioned using the scroll content's padding */}
        <View style={styles.logoutButtonWrapper}> 
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color={COLORS.primary} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        {/* Safety spacer view */}
        <View style={styles.bottomSpacer} />
        
      </ScrollView>
    </RNSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
    flexGrow: 1, 
    justifyContent: 'flex-start',
  },
  // Wrapper for the welcome text to control alignment
  welcomeWrapper: {
    width: '100%',
    alignItems: 'flex-end', // Align contents to the right
    marginTop: SIZES.padding, // Space above the welcome message
  },
  welcomeText: {
    fontSize: FONTS.body.fontSize,
    fontWeight: '500',
    color: COLORS.darkGray,
    marginBottom: 5,
    marginTop: 0,
    textAlign: 'right', // Ensure text itself is right-aligned if it wraps
  },
  header: {
    fontSize: 28, 
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
    textAlign: 'center',
    paddingTop: 0, 
    marginTop: 0, 
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding, 
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 12,
    marginBottom: SIZES.padding,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: SIZES.h3, 
    color: COLORS.white,
    marginTop: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Wrapper for the logout button (lower left)
  logoutButtonWrapper: {
    // Keeps the logout button on the left
    alignSelf: 'flex-start', 
    marginTop: SIZES.padding / 2, 
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: 'flex-start',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 5,
  },
  bottomSpacer: {
    height: SIZES.padding * 2, 
    backgroundColor: COLORS.background,
  }
});

export default MainScreen;