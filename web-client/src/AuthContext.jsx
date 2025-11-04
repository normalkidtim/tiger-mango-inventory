// web-client/src/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase'; 
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
  updatePassword,
  // NEW: Import sendEmailVerification
  sendEmailVerification,
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
    
    await setPersistence(auth, browserSessionPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // --- NEW VERIFICATION CHECK ---
    if (!user.emailVerified) {
      // If the email is not verified, send another verification email (in case they lost the first one)
      // and block the login.
      await sendEmailVerification(user);
      await signOut(auth); // Log them out immediately
      throw new Error("Please verify your email before logging in. A new verification link has been sent to your inbox.");
    }
    // --- END NEW CHECK ---

    const userProfile = await fetchUserProfile(user);

    if (userProfile) {
        if (userProfile.role !== 'admin' && userProfile.role !== 'manager') { // Allow manager to log in
            await signOut(auth);
            throw new Error("Access denied. Only Administrator or Manager accounts can access the Web Client.");
        }
        
        setCurrentUser(userProfile);
        return userCredential;
    } else {
        await signOut(auth);
        throw new Error("Access denied. Account profile not found or has been disabled.");
    }
  }

  // Admin function to create a new user
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
      // You can add this field, though Firebase's `user.emailVerified` is the source of truth
      emailVerified: false 
    });
    
    // 3. --- NEW: Send verification email ---
    await sendEmailVerification(user);
    // --- END NEW STEP ---
    
    return userCredential;
  }
  
  // Change the password for the currently authenticated user
  async function changeSelfPassword(newPassword) {
      if (!auth.currentUser) {
          throw new Error("No user is currently logged in.");
      }
      await updatePassword(auth.currentUser, newPassword);
  }


  // Sign out with Firebase
  function logout() {
    return signOut(auth);
  }

  useEffect(() => { 
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            // --- NEW: Check verification status on app load ---
            if (!user.emailVerified) {
              // If user is saved in session but not verified, log them out.
              await signOut(auth);
              setCurrentUser(null);
              setLoading(false);
              return;
            }
            // --- END NEW CHECK ---

            const userProfile = await fetchUserProfile(user);
            
            if (userProfile) {
                // Allow admin and manager roles
                if (userProfile.role !== 'admin' && userProfile.role !== 'manager') {
                    console.warn("Non-admin/manager user attempted to access Web Client. Forcing logout.");
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
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    signupAdmin, 
    changeSelfPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}