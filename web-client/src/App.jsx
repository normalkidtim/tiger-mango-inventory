import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Layout from './Layout';
import Login from './Login';
import Inventory from './pages/Inventory';
import StockLogs from './pages/StockLogs';
import PurchaseHistory from './pages/PurchaseHistory';
import MenuManager from './pages/MenuManager'; // ✅ NEW IMPORT

function ProtectedRoutes() {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  const { currentUser } = useAuth(); // ✅ Get currentUser to check login status

  return (
    <Routes>
      {/* ✅ If the user is logged in and tries to go to /login, redirect them to home */}
      <Route 
        path="/login" 
        element={currentUser ? <Navigate to="/" /> : <Login />} 
      />
      
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<Inventory />} />
        <Route path="/purchase-history" element={<PurchaseHistory />} />
        <Route path="/stock-logs" element={<StockLogs />} />
        <Route path="/menu-manager" element={<MenuManager />} /> {/* ✅ NEW ROUTE */}
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}