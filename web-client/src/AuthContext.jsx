// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase'; 
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
  // NEW: Import updatePassword function
  updatePassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Helper function to fetch user profile/role
async function fetchUserProfile(user) {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
        const userData = userDoc.data();
        // Return user object with role and other data
        return { ...user, role: userData.role, displayName: userData.firstName, ...userData };
    } 
    return null;
}


export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign in with Firebase
  async function login(email, password) {
    
    // Set persistence to SESSION before signing in.
    await setPersistence(auth, browserSessionPersistence);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userProfile = await fetchUserProfile(user);

    if (userProfile) {
        // Enforce Admin-Only Login (Existing check)
        if (userProfile.role !== 'admin') {
            await signOut(auth);
            throw new Error("Access denied. Only Administrator accounts can access the Web Client.");
        }
        
        setCurrentUser(userProfile);
        return userCredential;
    } else {
        // If Firestore profile is missing (deleted by admin), block login
        await signOut(auth);
        throw new Error("Access denied. Account profile not found or has been disabled.");
    }
  }

  // Admin function to create a new user directly
  async function signupAdmin(email, password, firstName, lastName, contactNumber, role) {
    // 1. Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // 2. Immediately create their profile document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      firstName,
      lastName,
      contactNumber, 
      role, 
    });
    
    return userCredential;
  }
  
  // NEW FUNCTION: Change the password for the currently authenticated user
  async function changeSelfPassword(newPassword) {
      if (!auth.currentUser) {
          throw new Error("No user is currently logged in.");
      }
      // Note: If the user hasn't logged in recently, this will fail with a 
      // 'auth/requires-recent-login' error, which is a standard Firebase security measure.
      await updatePassword(auth.currentUser, newPassword);
  }


  // Sign out with Firebase
  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    // Set persistence to SESSION immediately on component mount 
    setPersistence(auth, browserSessionPersistence)
        .then(() => {
            // Listen for authentication state changes
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    const userProfile = await fetchUserProfile(user);
                    
                    if (userProfile) {
                        // Enforce Admin-Only Web Session (Existing check)
                        if (userProfile.role !== 'admin') {
                            console.warn("Non-admin user attempted to access Web Client. Forcing logout.");
                            await signOut(auth);
                            setCurrentUser(null);
                        } else {
                            setCurrentUser(userProfile);
                        }
                    } else {
                        console.warn("User profile not found in Firestore. Revoking access.");
                        await signOut(auth);
                        setCurrentUser(null);
                    }
                } else {
                    setCurrentUser(null);
                }
                setLoading(false);
            });
            return unsubscribe;
        })
        .catch((error) => {
            console.error("Error setting Firebase persistence:", error);
            setLoading(false);
        });

  }, []);

  const value = {
    currentUser,
    login,
    logout,
    signupAdmin, 
    changeSelfPassword, // EXPOSE THE NEW FUNCTION
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}