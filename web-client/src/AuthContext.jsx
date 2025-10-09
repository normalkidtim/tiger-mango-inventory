// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase'; // We now use the real firebase
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign in with Firebase
  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user role from Firestore 'users' collection
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      // Add the role to the user object
      user.role = userDoc.data().role;
    } else {
      user.role = 'employee'; // Default role if not found
    }
    setCurrentUser(user);
    return userCredential;
  }

  // Sign out with Firebase
  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // If a user is logged in, fetch their role from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          user.role = userDoc.data().role;
        } else {
          user.role = 'employee';
        }
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}