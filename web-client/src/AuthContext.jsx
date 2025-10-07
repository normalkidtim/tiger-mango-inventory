// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function signup(email, password, firstName, lastName) {
    return new Promise((resolve, reject) => {
      try {
        // Check if user already exists
        const users = JSON.parse(localStorage.getItem('tigerMangoUsers') || '[]');
        const existingUser = users.find(user => user.email === email);
        
        if (existingUser) {
          reject(new Error('Email already exists'));
          return;
        }

        // Create new user
        const newUser = {
          uid: Math.random().toString(36).substr(2, 9),
          email,
          password,
          firstName,
          lastName,
          role: users.length === 0 ? 'admin' : 'pending',
          isActive: users.length === 0,
          createdAt: new Date().toISOString()
        };

        // Save to localStorage
        users.push(newUser);
        localStorage.setItem('tigerMangoUsers', JSON.stringify(users));
        
        // If first user, auto-login
        if (users.length === 1) {
          localStorage.setItem('tigerMangoCurrentUser', JSON.stringify(newUser));
          setCurrentUser(newUser);
        }

        resolve({ user: newUser });
      } catch (error) {
        reject(error);
      }
    });
  }

  function login(email, password) {
    return new Promise((resolve, reject) => {
      try {
        const users = JSON.parse(localStorage.getItem('tigerMangoUsers') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
          if (!user.isActive && user.role !== 'admin') {
            reject(new Error('Account pending admin approval'));
            return;
          }
          
          localStorage.setItem('tigerMangoCurrentUser', JSON.stringify(user));
          setCurrentUser(user);
          resolve({ user });
        } else {
          reject(new Error('Invalid email or password'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  function logout() {
    localStorage.removeItem('tigerMangoCurrentUser');
    setCurrentUser(null);
    return Promise.resolve();
  }

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('tigerMangoCurrentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (error) {
        localStorage.removeItem('tigerMangoCurrentUser');
      }
    }
    setLoading(false);
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}