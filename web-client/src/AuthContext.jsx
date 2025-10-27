// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase'; 
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  // 💡 NEW: Import required persistence functions
  setPersistence,
  browserSessionPersistence,
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
    
    // ⭐ CHANGE 1: Set persistence to SESSION before signing in.
    // This tells Firebase to clear the session when the window/tab is closed.
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
        await signOut(auth);
        throw new Error("Access denied. Account profile not found or has been disabled.");
    }
  }

  // Admin function to create a new user directly
  async function signupAdmin(email, password, firstName, lastName, contactNumber, role) {
    // Note: Persistence is implicitly set by the caller's session, but the login function handles it on sign-in.
    
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


  // Sign out with Firebase
  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    // ⭐ CHANGE 2: Set persistence to SESSION immediately on component mount 
    // to ensure subsequent reloads/state changes respect the session duration.
    // NOTE: This runs asynchronously, but typically before the login happens.
    // The explicit setting in `login` ensures it's applied correctly during sign-in.
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

    // The cleanup function is returned inside the .then block above.
    // No explicit return here as the listener is set up conditionally.
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    signupAdmin, 
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}