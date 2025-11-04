import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { FiGrid, FiFileText, FiLogOut, FiShoppingCart, FiEdit, FiBarChart2, FiUsers, FiUserPlus, FiMenu, FiX } from "react-icons/fi"; 

export default function Layout() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  // New state for mobile menu toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
  
  // Toggle function
  const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Close and navigate (used by NavLinks)
  const handleNavLinkClick = () => {
      // Close sidebar regardless of screen size after navigation if it was open
      setIsSidebarOpen(false);
  };


  return (
    <div style={{ display: "flex" }}>
      
      {/* --- MOBILE HEADER BAR: Contains the Hamburger Icon --- */}
      <div className="mobile-header-bar">
        {/* Hamburger/Close Button */}
        <button className="hamburger-btn" onClick={toggleSidebar} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {/* Show X icon when menu is open, otherwise show hamburger */}
            {isSidebarOpen ? <FiX size={24} color="var(--primary-brand)" /> : <FiMenu size={24} color="var(--primary-brand)" />}
        </button>
        {/* App Title/Logo for the Mobile Header */}
        <div className="sidebar-header" style={{ margin: 0 }}>
          <div className="sidebar-logo-circle"></div>
          <h2 className="sidebar-title" style={{ color: 'var(--text-primary)' }}>Tealicieux</h2>
        </div>
      </div>
      
      {/* MOBILE OVERLAY: Dims the background when menu is open */}
      {isSidebarOpen && <div className="mobile-overlay" onClick={toggleSidebar}></div>}

      {/* SIDEBAR: The collapsible navigation menu */}
      <aside className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}> 
        
        {/* Desktop Sidebar Header (Visible only on Desktop) */}
        <div className="sidebar-header desktop-header">
          <div className="sidebar-logo-circle"></div>
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
          
          {/* Admin Links - Only visible to Admins */}
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
          <button onClick={() => { handleLogout(); handleNavLinkClick(); }} className="logout-btn"><FiLogOut />Logout</button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}