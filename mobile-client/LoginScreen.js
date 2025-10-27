// mobile-client/LoginScreen.js

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { COLORS, FONTS, SIZES } from './styles';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = getAuth();

  const handleLogin = async () => {
    if (!email || !password) {
        Alert.alert("Error", "Please enter both email and password.");
        return;
    }
    setLoading(true);
    try {
      // Note: This relies on the AuthContext logic in the web client 
      // which assumes the user role must be 'admin' for web access.
      // Here, we allow ANY valid user (employee, manager, admin) to log into the mobile client.
      await signInWithEmailAndPassword(auth, email, password);
      
      // The onAuthStateChanged listener in app.js will handle setting the user and navigating away.
    } catch (error) {
      console.error("Login failed:", error.message);
      Alert.alert("Login Failed", "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Tiger Mango POS</Text>
        <Text style={styles.subHeader}>Staff Login Required</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.darkGray}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={COLORS.darkGray}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.noticeContainer}>
            <Text style={styles.noticeText}>
                * All staff roles (Employee, Manager, Admin) can access the POS app.
            </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  content: {
    padding: SIZES.padding,
    alignItems: 'center',
  },
  header: {
    ...FONTS.h1,
    color: COLORS.primary,
    marginBottom: 10,
  },
  subHeader: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: 40,
  },
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 20,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray,
    color: COLORS.text,
    fontSize: 16,
  },
  button: {
    width: '100%',
    padding: 15,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    ...FONTS.h3,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  noticeContainer: {
    marginTop: 40,
    padding: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
  },
  noticeText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
  }
});

export default LoginScreen;