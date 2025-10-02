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
    // ✅ Inventory listener
    const unsubInventory = onSnapshot(collection(db, "inventory"), (snap) => {
      snap.forEach((docSnap) => {
        if (docSnap.id === "cups") setCups(docSnap.data());
        if (docSnap.id === "straw") setStraws(docSnap.data());
        if (docSnap.id === "add-ons") setAddons(docSnap.data());
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
        user: "employee", // You can change this to dynamic user later
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
                {["tall", "grande", "liter"].map((key) => (
                  <li key={key}>
                    <span className="item-label">
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </span>
                    <input
                      type="number"
                      min="0"
                      defaultValue={cups[key] ?? 0}
                      onBlur={(e) =>
                        handleStockChange("cups", key, e.target.value, `Cups - ${key}`)
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>

            {/* Straws */}
            <div className="card">
              <h2>🥤 Straws</h2>
              <ul>
                {["regular", "big"].map((key) => (
                  <li key={key}>
                    <span className="item-label">
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </span>
                    <input
                      type="number"
                      min="0"
                      defaultValue={straws[key] ?? 0}
                      onBlur={(e) =>
                        handleStockChange("straw", key, e.target.value, `Straws - ${key}`)
                      }
                    />
                  </li>
                ))}
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
                        defaultValue={addons[key] ?? 0}
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