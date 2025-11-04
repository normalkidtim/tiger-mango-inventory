// web-client/src/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
// UPDATED: Import adminAuth
import { auth, db, adminAuth } from './firebase'; 
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
  updatePassword,
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

    // --- VERIFICATION CHECK ---
    if (!user.emailVerified) {
      await sendEmailVerification(user);
      await signOut(auth); 
      throw new Error("Please verify your email before logging in. A new verification link has been sent to your inbox.");
    }
    // --- END CHECK ---

    const userProfile = await fetchUserProfile(user);

    if (userProfile) {
        if (userProfile.role !== 'admin' && userProfile.role !== 'manager') { 
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
    
    // --- UPDATED BLOCK ---
    // 1. Create the user in Firebase Auth using the SECONDARY instance
    //    This will NOT log out the currently logged-in admin.
    const userCredential = await createUserWithEmailAndPassword(adminAuth, email, password); 
    const user = userCredential.user;
    // --- END UPDATED BLOCK ---
    
    // 2. Immediately create their profile document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      firstName,
      lastName,
      contactNumber, 
      role, 
      emailVerified: false 
    });
    
    // 3. --- Send verification email ---
    // This was already here and is correct! It will now work as expected.
    await sendEmailVerification(user);
    
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
            // --- Check verification status on app load ---
            if (!user.emailVerified) {
              // If user is saved in session but not verified, log them out.
              await signOut(auth);
              setCurrentUser(null);
              setLoading(false);
              return;
            }
            // --- END CHECK ---

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