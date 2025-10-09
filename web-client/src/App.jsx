import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Layout from './Layout';
import Login from './Login';
import Inventory from './pages/Inventory';
import StockLogs from './pages/StockLogs';
import PurchaseHistory from './pages/PurchaseHistory'; // ✅ Import the new page

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
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<Inventory />} />
        {/* ✅ Added the new route here */}
        <Route path="/purchase-history" element={<PurchaseHistory />} />
        <Route path="/stock-logs" element={<StockLogs />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}