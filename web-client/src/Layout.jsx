import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { FiGrid, FiFileText, FiLogOut, FiShoppingCart, FiEdit, FiBarChart2, FiUsers, FiUserPlus } from "react-icons/fi"; 

export default function Layout() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex" }}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-circle"></div>
          <h2 className="sidebar-title">Tealicieux</h2>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className="sidebar-link"><FiGrid /> Inventory</NavLink>
          <NavLink to="/purchase-history" className="sidebar-link"><FiShoppingCart /> Purchase History</NavLink>
          <NavLink to="/stock-logs" className="sidebar-link"><FiFileText /> Stock Logs</NavLink>
          {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
              <NavLink to="/menu-manager" className="sidebar-link"><FiEdit /> Menu Manager</NavLink>
          )}
          <NavLink to="/analytics" className="sidebar-link"><FiBarChart2 /> Sales Analytics</NavLink> 
          
          {/* Admin Links - Only visible to Admins */}
          {currentUser?.role === 'admin' && (
            <>
              <NavLink to="/admin-panel" className="sidebar-link"><FiUsers /> Admin Panel</NavLink>
              <NavLink to="/create-user" className="sidebar-link"><FiUserPlus /> Create User</NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          {currentUser && <p className="sidebar-user">{currentUser.displayName || currentUser.email}</p>}
          <button onClick={handleLogout} className="logout-btn"><FiLogOut />Logout</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}