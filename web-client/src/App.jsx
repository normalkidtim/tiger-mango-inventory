import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
  getDocs
} from "firebase/firestore";
import { db } from "./firebase";
import "./App.css";

export default function App() {
  const [cups, setCups] = useState({});
  const [straws, setStraws] = useState({});
  const [addons, setAddons] = useState({});
  const [stockLogs, setStockLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("inventory");
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    // ✅ Debug: Check ALL inventory documents
    const debugFirebase = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "inventory"));
        let debugText = "🔥 ALL INVENTORY DOCUMENTS:\n";
        
        querySnapshot.forEach((doc) => {
          debugText += `📄 Document: ${doc.id}\n`;
          debugText += `📊 Data: ${JSON.stringify(doc.data(), null, 2)}\n`;
          debugText += "─".repeat(50) + "\n";
        });
        
        setDebugInfo(debugText);
        console.log(debugText);
      } catch (error) {
        console.error("Debug error:", error);
        setDebugInfo(`❌ Debug Error: ${error.message}`);
      }
    };

    debugFirebase();

    // ✅ Inventory listener
    const unsubInventory = onSnapshot(collection(db, "inventory"), (snap) => {
      console.log("🔄 Inventory snapshot received");
      let foundCups = false;
      let foundStraws = false;
      
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        console.log(`📦 ${docSnap.id}:`, data);
        
        if (docSnap.id === "cups") {
          setCups(data);
          foundCups = true;
          console.log("✅ Cups set:", data);
        }
        if (docSnap.id === "straw") {
          setStraws(data);
          foundStraws = true;
          console.log("✅ Straws set:", data);
        }
        if (docSnap.id === "straws") { // Try plural version
          setStraws(data);
          foundStraws = true;
          console.log("✅ Straws (plural) set:", data);
        }
        if (docSnap.id === "add-ons") {
          setAddons(data);
          console.log("✅ Add-ons set:", data);
        }
      });

      if (!foundCups) console.log("❌ No 'cups' document found!");
      if (!foundStraws) console.log("❌ No 'straw' or 'straws' document found!");
    });

    // ✅ Stock Logs
    const unsubLogs = onSnapshot(collection(db, "stock-logs"), (snap) => {
      let logs = [];
      snap.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...docSnap.data() });
      });
      logs.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));
      setStockLogs(logs);
    });

    return () => {
      unsubInventory();
      unsubLogs();
    };
  }, []);

  // ✅ Update stock + log it
  const handleStockChange = async (collectionName, field, value, itemName) => {
    try {
      const numericValue = Number(value);
      
      if (isNaN(numericValue) || numericValue < 0) {
        alert("❌ Please enter a valid number");
        return;
      }

      console.log(`🔄 Updating ${collectionName}.${field} to ${numericValue}`);

      // Update the inventory collection
      await updateDoc(doc(db, "inventory", collectionName), {
        [field]: numericValue,
      });

      // Add a log entry
      await addDoc(collection(db, "stock-logs"), {
        item: itemName || `${collectionName} - ${field}`,
        newValue: numericValue,
        user: "employee",
        timestamp: serverTimestamp(),
      });

      alert("✅ Stock updated successfully!");
    } catch (err) {
      console.error("Error updating stock:", err);
      alert("❌ Failed to update stock");
    }
  };

  // ✅ Get friendly name for add-ons
  const getAddonDisplayName = (key) => {
    const names = {
      "chocolate-syrup": "Chocolate Syrup",
      "strawberry-syrup": "Strawberry Syrup",
      "crushed-grahams": "Crushed Grahams",
      "ice-cream": "Ice Cream",
      "oreo-crumble": "Oreo Crumble",
      "oreo-grahams": "Oreo Grahams",
      "pearl": "Pearl",
      "sliced-mango": "Sliced Mango",
    };
    return names[key] || key;
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <h2 className="sidebar-title">Tiger Mango (Employee)</h2>
        <button onClick={() => setActiveTab("inventory")}>📦 Inventory Management</button>
        <button onClick={() => setActiveTab("logs")}>📜 Stock Update Logs</button>
        <button onClick={() => setActiveTab("debug")}>🐛 Debug Info</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {activeTab === "inventory" && (
          <div className="grid">
            {/* Cups */}
            <div className="card">
              <h2>🧃 Cups</h2>
              <div style={{color: 'red', fontSize: '12px', marginBottom: '10px'}}>
                Current data: {JSON.stringify(cups)}
              </div>
              <ul>
                <li>
                  <span className="item-label">Tall:</span>
                  <input
                    type="number"
                    min="0"
                    value={cups.tall ?? cups.Tall ?? 0}
                    onChange={(e) => setCups(prev => ({...prev, tall: Number(e.target.value)}))}
                    onBlur={(e) =>
                      handleStockChange("cups", "tall", e.target.value, "Cups - Tall")
                    }
                  />
                </li>
                <li>
                  <span className="item-label">Grande:</span>
                  <input
                    type="number"
                    min="0"
                    value={cups.grande ?? cups.Grande ?? 0}
                    onChange={(e) => setCups(prev => ({...prev, grande: Number(e.target.value)}))}
                    onBlur={(e) =>
                      handleStockChange("cups", "grande", e.target.value, "Cups - Grande")
                    }
                  />
                </li>
                <li>
                  <span className="item-label">1 Liter:</span>
                  <input
                    type="number"
                    min="0"
                    value={cups.liter ?? cups.Liter ?? cups['1liter'] ?? 0}
                    onChange={(e) => setCups(prev => ({...prev, liter: Number(e.target.value)}))}
                    onBlur={(e) =>
                      handleStockChange("cups", "liter", e.target.value, "Cups - 1 Liter")
                    }
                  />
                </li>
              </ul>
            </div>

            {/* Straws */}
            <div className="card">
              <h2>🥤 Straws</h2>
              <div style={{color: 'red', fontSize: '12px', marginBottom: '10px'}}>
                Current data: {JSON.stringify(straws)}
              </div>
              <ul>
                <li>
                  <span className="item-label">Regular:</span>
                  <input
                    type="number"
                    min="0"
                    value={straws.regular ?? straws.Regular ?? 0}
                    onChange={(e) => setStraws(prev => ({...prev, regular: Number(e.target.value)}))}
                    onBlur={(e) =>
                      handleStockChange("straw", "regular", e.target.value, "Straws - Regular")
                    }
                  />
                </li>
                <li>
                  <span className="item-label">Big:</span>
                  <input
                    type="number"
                    min="0"
                    value={straws.big ?? straws.Big ?? 0}
                    onChange={(e) => setStraws(prev => ({...prev, big: Number(e.target.value)}))}
                    onBlur={(e) =>
                      handleStockChange("straw", "big", e.target.value, "Straws - Big")
                    }
                  />
                </li>
              </ul>
            </div>

            {/* Add-ons */}
            <div className="card">
              <h2>🍧 Add-ons</h2>
              <div style={{color: 'green', fontSize: '12px', marginBottom: '10px'}}>
                Working! Data: {Object.keys(addons).length} items loaded
              </div>
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
                        value={addons[key] ?? 0}
                        onChange={(e) => {
                          const newAddons = {...addons};
                          newAddons[key] = Number(e.target.value);
                          setAddons(newAddons);
                        }}
                        onBlur={(e) =>
                          handleStockChange("add-ons", key, e.target.value, getAddonDisplayName(key))
                        }
                      />
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}

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
                      <td>
                        {log.timestamp 
                          ? log.timestamp.toDate().toLocaleString() 
                          : "Just now"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "debug" && (
          <div className="card">
            <h2>🐛 Debug Information</h2>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '15px', 
              borderRadius: '5px', 
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              {debugInfo || "Loading debug information..."}
            </pre>
            
            <h3>Current State:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h4>Cups State:</h4>
                <pre>{JSON.stringify(cups, null, 2)}</pre>
              </div>
              <div>
                <h4>Straws State:</h4>
                <pre>{JSON.stringify(straws, null, 2)}</pre>
              </div>
              <div>
                <h4>Add-ons State:</h4>
                <pre>{JSON.stringify(addons, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}