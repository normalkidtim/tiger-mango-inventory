import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Layout from './Layout';
import Login from './Login';
import Inventory from './pages/Inventory';
import StockLogs from './pages/StockLogs';
import PurchaseHistory from './pages/PurchaseHistory';
import MenuManager from './pages/MenuManager'; 
import Analytics from './pages/Analytics';
import AdminPanel from './pages/AdminPanel'; 

// Component to wrap all protected routes with the Layout
function ProtectedRoutes() {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    // If no user is logged in, redirect to login
    return <Navigate to="/login" />;
  }

  // Render the Layout component, which contains the Outlet
  return <Layout />; 
}

export default function App() {
  const { currentUser } = useAuth(); 

  // Function to determine if user has Manager or Admin role
  const isManagerOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const isAdmin = currentUser?.role === 'admin';
  
  return (
    <Routes>
      {/* Route for Login Page */}
      <Route 
        path="/login" 
        element={currentUser ? <Navigate to="/" /> : <Login />} 
      />
      
      {/* The ProtectedRoutes wrapper uses <Layout /> internally */}
      <Route element={<ProtectedRoutes />}> 
        {/* Child Routes that render inside the <Outlet /> within <Layout /> */}
        
        {/* Public Protected Routes */}
        <Route index element={<Inventory />} />
        <Route path="/purchase-history" element={<PurchaseHistory />} />
        <Route path="/stock-logs" element={<StockLogs />} />
        <Route path="/analytics" element={<Analytics />} />

        {/* Role-Gated Routes */}
        <Route 
          path="/menu-manager" 
          element={isManagerOrAdmin ? <MenuManager /> : <Navigate to="/" />}
        />
        <Route 
          path="/admin-panel" 
          element={isAdmin ? <AdminPanel /> : <Navigate to="/" />}
        />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Route>

    </Routes>
  );
}