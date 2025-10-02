import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";
import "./App.css";

export default function App() {
  const [cups, setCups] = useState({});
  const [straws, setStraws] = useState({});
  const [addons, setAddons] = useState({});
  const [stockLogs, setStockLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("inventory");

  useEffect(() => {
    // ✅ Inventory listener with debug logging
    const unsubInventory = onSnapshot(collection(db, "inventory"), (snap) => {
      console.log("🔥 Raw inventory data:", snap.docs.map(doc => ({ id: doc.id, data: doc.data() })));
      
      snap.forEach((docSnap) => {
        if (docSnap.id === "cups") {
          console.log("📦 Cups data:", docSnap.data());
          setCups(docSnap.data());
        }
        if (docSnap.id === "straw") {
          console.log("🥤 Straws data:", docSnap.data());
          setStraws(docSnap.data());
        }
        if (docSnap.id === "add-ons") {
          console.log("🍧 Add-ons data:", docSnap.data());
          setAddons(docSnap.data());
        }
      });
    });

    // ✅ Stock Logs
    const unsubLogs = onSnapshot(collection(db, "stock-logs"), (snap) => {
      let logs = [];
      snap.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort by timestamp descending
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
      </div>

      {/* Main Content */}
      <div className="main-content">
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
                    value={cups.tall ?? 0}
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
                    value={cups.grande ?? 0}
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
                    value={cups.liter ?? 0}
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
              <ul>
                <li>
                  <span className="item-label">Regular:</span>
                  <input
                    type="number"
                    min="0"
                    value={straws.regular ?? 0}
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
                    value={straws.big ?? 0}
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
      </div>
    </div>
  );
}