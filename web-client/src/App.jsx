// App.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import Login from "./Login";
import Register from "./Register";
import "./App.css";

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [userRole, setUserRole] = useState('employee');
  const [activeTab, setActiveTab] = useState("inventory");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  
  // Inventory state
  const [cups, setCups] = useState({ tall: 0, grande: 0, liter: 0 });
  const [straws, setStraws] = useState({ regular: 0, big: 0 });
  const [addons, setAddons] = useState({
    'chocolate-syrup': 0,
    'strawberry-syrup': 0,
    'crushed-grahams': 0,
    'ice-cream': 0,
    'oreo-crumble': 0,
    'pearl': 0,
    'sliced-mango': 0
  });
  const [stockLogs, setStockLogs] = useState([]);

  useEffect(() => {
    if (currentUser) {
      setUserRole(currentUser.role || 'employee');
      
      // Load users for admin panel
      const users = JSON.parse(localStorage.getItem('tigerMangoUsers') || '[]');
      setAllUsers(users);
      setPendingUsers(users.filter(user => !user.isActive && user.role === 'pending'));
      
      // Load inventory from localStorage
      const savedInventory = JSON.parse(localStorage.getItem('tigerMangoInventory') || '{}');
      if (savedInventory.cups) setCups(savedInventory.cups);
      if (savedInventory.straws) setStraws(savedInventory.straws);
      if (savedInventory.addons) setAddons(savedInventory.addons);
      
      // Load stock logs
      const savedLogs = JSON.parse(localStorage.getItem('tigerMangoStockLogs') || '[]');
      setStockLogs(savedLogs);
    }
  }, [currentUser]);

  const approveUser = (userEmail) => {
    const users = JSON.parse(localStorage.getItem('tigerMangoUsers') || '[]');
    const updatedUsers = users.map(user => 
      user.email === userEmail ? { ...user, isActive: true, role: 'employee' } : user
    );
    localStorage.setItem('tigerMangoUsers', JSON.stringify(updatedUsers));
    setAllUsers(updatedUsers);
    setPendingUsers(updatedUsers.filter(user => !user.isActive && user.role === 'pending'));
    alert(`✅ ${userEmail} has been approved!`);
  };

  const rejectUser = (userEmail) => {
    const users = JSON.parse(localStorage.getItem('tigerMangoUsers') || '[]');
    const updatedUsers = users.filter(user => user.email !== userEmail);
    localStorage.setItem('tigerMangoUsers', JSON.stringify(updatedUsers));
    setAllUsers(updatedUsers);
    setPendingUsers(updatedUsers.filter(user => !user.isActive && user.role === 'pending'));
    alert(`❌ ${userEmail} has been rejected.`);
  };

  const updateStock = (category, item, value) => {
    const numericValue = Number(value);
    if (isNaN(numericValue) || numericValue < 0) {
      alert("❌ Please enter a valid number");
      return;
    }

    // Update local state
    if (category === 'cups') {
      setCups(prev => ({ ...prev, [item]: numericValue }));
    } else if (category === 'straws') {
      setStraws(prev => ({ ...prev, [item]: numericValue }));
    } else if (category === 'addons') {
      setAddons(prev => ({ ...prev, [item]: numericValue }));
    }

    // Save to localStorage
    const inventory = JSON.parse(localStorage.getItem('tigerMangoInventory') || '{}');
    inventory[category] = category === 'cups' ? { ...cups, [item]: numericValue } :
                         category === 'straws' ? { ...straws, [item]: numericValue } :
                         { ...addons, [item]: numericValue };
    localStorage.setItem('tigerMangoInventory', JSON.stringify(inventory));

    // Add to stock logs
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      item: `${category} - ${item}`,
      newValue: numericValue,
      user: currentUser?.email || 'employee',
      timestamp: new Date().toLocaleString()
    };
    
    const updatedLogs = [newLog, ...stockLogs].slice(0, 50); // Keep last 50 logs
    setStockLogs(updatedLogs);
    localStorage.setItem('tigerMangoStockLogs', JSON.stringify(updatedLogs));

    alert("✅ Stock updated successfully!");
  };

  const getAddonDisplayName = (key) => {
    const names = {
      "chocolate-syrup": "Chocolate Syrup",
      "strawberry-syrup": "Strawberry Syrup",
      "crushed-grahams": "Crushed Grahams",
      "ice-cream": "Ice Cream",
      "oreo-crumble": "Oreo Crumble",
      "pearl": "Pearl",
      "sliced-mango": "Sliced Mango",
    };
    return names[key] || key;
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h2 className="sidebar-title">Tiger Mango</h2>
        <div className="user-info">
          <p>Welcome, {currentUser?.email}</p>
          <p className="user-role">Role: {userRole}</p>
          <button onClick={logout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
        <button onClick={() => setActiveTab("inventory")}>📦 Inventory Management</button>
        <button onClick={() => setActiveTab("logs")}>📜 Stock Update Logs</button>
        
        {/* Show different buttons based on role */}
        {userRole === 'admin' && (
          <button onClick={() => setActiveTab("admin")}>👑 User Management</button>
        )}
        <button onClick={() => setActiveTab("register")}>
          {userRole === 'admin' ? '👤 Create User' : '👤 Request Access'}
        </button>
      </div>

      <div className="main-content">
        {/* INVENTORY MANAGEMENT */}
        {activeTab === "inventory" && (
          <div className="grid">
            {/* Cups */}
            <div className="card">
              <h2>🧃 Cups</h2>
              <ul>
                <li>
                  <span className="item-label">Tall:</span>
                  <input
                    type="number"
                    min="0"
                    value={cups.tall}
                    onChange={(e) => setCups(prev => ({...prev, tall: Number(e.target.value)}))}
                    onBlur={(e) => updateStock("cups", "tall", e.target.value)}
                  />
                </li>
                <li>
                  <span className="item-label">Grande:</span>
                  <input
                    type="number"
                    min="0"
                    value={cups.grande}
                    onChange={(e) => setCups(prev => ({...prev, grande: Number(e.target.value)}))}
                    onBlur={(e) => updateStock("cups", "grande", e.target.value)}
                  />
                </li>
                <li>
                  <span className="item-label">1 Liter:</span>
                  <input
                    type="number"
                    min="0"
                    value={cups.liter}
                    onChange={(e) => setCups(prev => ({...prev, liter: Number(e.target.value)}))}
                    onBlur={(e) => updateStock("cups", "liter", e.target.value)}
                  />
                </li>
              </ul>
            </div>

            {/* Straws */}
            <div className="card">
              <h2>🥤 Straws</h2>
              <ul>
                <li>
                  <span className="item-label">Regular:</span>
                  <input
                    type="number"
                    min="0"
                    value={straws.regular}
                    onChange={(e) => setStraws(prev => ({...prev, regular: Number(e.target.value)}))}
                    onBlur={(e) => updateStock("straws", "regular", e.target.value)}
                  />
                </li>
                <li>
                  <span className="item-label">Big:</span>
                  <input
                    type="number"
                    min="0"
                    value={straws.big}
                    onChange={(e) => setStraws(prev => ({...prev, big: Number(e.target.value)}))}
                    onBlur={(e) => updateStock("straws", "big", e.target.value)}
                  />
                </li>
              </ul>
            </div>

            {/* Add-ons */}
            <div className="card">
              <h2>🍧 Add-ons</h2>
              <ul>
                {Object.keys(addons)
                  .sort()
                  .map((key) => (
                    <li key={key}>
                      <span className="item-label">
                        {getAddonDisplayName(key)}:
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={addons[key]}
                        onChange={(e) => {
                          const newAddons = {...addons};
                          newAddons[key] = Number(e.target.value);
                          setAddons(newAddons);
                        }}
                        onBlur={(e) => updateStock("addons", key, e.target.value)}
                      />
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}

        {/* STOCK LOGS */}
        {activeTab === "logs" && (
          <div className="card">
            <h2>📜 Stock Update Logs</h2>
            {stockLogs.length === 0 ? (
              <p>No stock updates yet.</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>New Stock Level</th>
                    <th>Updated By</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {stockLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.item}</td>
                      <td>{log.newValue}</td>
                      <td>{log.user}</td>
                      <td>{log.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* REGISTRATION */}
        {activeTab === "register" && (
          <Register onToggleForm={() => setActiveTab("inventory")} />
        )}

        {/* ADMIN PANEL */}
        {activeTab === "admin" && userRole === 'admin' && (
          <div className="admin-panel">
            <h2>👑 Admin Panel - User Management</h2>
            
            {/* Pending Approvals */}
            <div className="admin-section">
              <h3>⏳ Pending Approval ({pendingUsers.length})</h3>
              {pendingUsers.length === 0 ? (
                <p className="no-data">No pending registration requests.</p>
              ) : (
                <div className="user-grid">
                  {pendingUsers.map(user => (
                    <div key={user.uid} className="user-card pending">
                      <div className="user-info">
                        <h4>{user.firstName} {user.lastName}</h4>
                        <p>📧 {user.email}</p>
                        <p>📅 Registered: {new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="user-actions">
                        <button 
                          onClick={() => approveUser(user.email)}
                          className="btn-approve"
                        >
                          ✅ Approve
                        </button>
                        <button 
                          onClick={() => rejectUser(user.email)}
                          className="btn-reject"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Users */}
            <div className="admin-section">
              <h3>✅ Active Users ({allUsers.filter(u => u.isActive).length})</h3>
              {allUsers.filter(u => u.isActive).length === 0 ? (
                <p className="no-data">No active users.</p>
              ) : (
                <div className="user-grid">
                  {allUsers.filter(u => u.isActive).map(user => (
                    <div key={user.uid} className="user-card active">
                      <div className="user-info">
                        <h4>{user.firstName} {user.lastName}</h4>
                        <p>📧 {user.email}</p>
                        <p>🎯 Role: <span className={`role-badge ${user.role}`}>{user.role}</span></p>
                        <p>✅ Active since: {new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [showLogin, setShowLogin] = useState(true);
  const { currentUser } = useAuth();

  // Show loading while checking auth
  if (currentUser === undefined) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return showLogin ? (
      <Login onToggleForm={() => setShowLogin(false)} />
    ) : (
      <Register onToggleForm={() => setShowLogin(true)} />
    );
  }

  return <Dashboard />;
}