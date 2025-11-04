import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { FiGrid, FiFileText, FiLogOut, FiShoppingCart, FiEdit, FiBarChart2, FiUsers, FiUserPlus, FiMenu, FiX } from "react-icons/fi"; 

export default function Layout() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  // State for mobile menu toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
  
  // Toggles the sidebar
  const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Closes sidebar after a link is clicked
  const handleNavLinkClick = () => {
      setIsSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      
      {/* --- MOBILE-ONLY HEADER BAR --- */}
      <div className="mobile-header-bar">
        <button 
            className="hamburger-btn" 
            onClick={toggleSidebar}
        >
            <FiMenu size={24} />
        </button>
        <div className="mobile-header-title">
          {/* REMOVED the logo circle div */}
          <h2 className="sidebar-title">Tealicieux</h2>
        </div>
      </div>
      
      {/* --- MOBILE-ONLY OVERLAY --- */}
      {isSidebarOpen && <div className="mobile-overlay" onClick={toggleSidebar}></div>}

      {/* --- THE SIDEBAR (NAVIGATION MENU) --- */}
      <aside className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}> 
        
        {/* Header for Mobile (Inside Menu) */}
        <div className="sidebar-mobile-header">
            <div className="sidebar-header-title">
                {/* REMOVED the logo circle div */}
                <h2 className="sidebar-title">Tealicieux</h2>
            </div>
            <button className="sidebar-close-btn" onClick={toggleSidebar}>
                <FiX size={24} />
            </button>
        </div>

        {/* Header for Desktop */}
        <div className="sidebar-header desktop-header">
          {/* REMOVED the logo circle div */}
          <h2 className="sidebar-title">Tealicieux</h2>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <NavLink to="/" className="sidebar-link" onClick={handleNavLinkClick}><FiGrid /> Inventory</NavLink>
          <NavLink to="/purchase-history" className="sidebar-link" onClick={handleNavLinkClick}><FiShoppingCart /> Purchase History</NavLink>
          <NavLink to="/stock-logs" className="sidebar-link" onClick={handleNavLinkClick}><FiFileText /> Stock Logs</NavLink>
          {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
              <NavLink to="/menu-manager" className="sidebar-link" onClick={handleNavLinkClick}><FiEdit /> Menu Manager</NavLink>
          )}
          <NavLink to="/analytics" className="sidebar-link" onClick={handleNavLinkClick}><FiBarChart2 /> Sales Analytics</NavLink> 
          
          {/* Admin Links */}
          {currentUser?.role === 'admin' && (
            <>
              <NavLink to="/admin-panel" className="sidebar-link" onClick={handleNavLinkClick}><FiUsers /> Admin Panel</NavLink>
              <NavLink to="/create-user" className="sidebar-link" onClick={handleNavLinkClick}><FiUserPlus /> Create User</NavLink>
            </>
          )}
        </nav>
        
        {/* Logout Button */}
        <div className="sidebar-bottom">
          {currentUser && <p className="sidebar-user">{currentUser.displayName || currentUser.email}</p>}
          <button 
            onClick={() => { handleLogout(); handleNavLinkClick(); }} 
            className="btn btn-secondary logout-btn"
          >
            <FiLogOut />Logout
          </button>
        </div>
      </aside>
      
      {/* --- MAIN CONTENT AREA --- */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}