import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  orderBy,
  query
} from "firebase/firestore";
import { db } from "./firebase";
import "./App.css";

export default function App() {
  const [cups, setCups] = useState({});
  const [straws, setStraws] = useState({});
  const [addons, setAddons] = useState({});
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("inventory");

  useEffect(() => {
    // Listen to inventory
    const unsubInventory = onSnapshot(collection(db, "inventory"), (snap) => {
      snap.forEach((docSnap) => {
        if (docSnap.id === "cups") setCups(docSnap.data());
        if (docSnap.id === "straw") setStraws(docSnap.data());
        if (docSnap.id === "add-ons") setAddons(docSnap.data());
      });
    });

    // Listen to orders
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubOrders = onSnapshot(q, (snap) => {
      let orders = [];
      snap.forEach((docSnap) => {
        orders.push({ id: docSnap.id, ...docSnap.data() });
      });
      setPurchaseHistory(orders);
    });

    return () => {
      unsubInventory();
      unsubOrders();
    };
  }, []);

  // Update stock
  const handleStockChange = async (collectionName, field, value) => {
    try {
      await updateDoc(doc(db, "inventory", collectionName), {
        [field]: Number(value),
      });
      alert("✅ Stock updated successfully!");
    } catch (err) {
      console.error("Error updating stock:", err);
      alert("❌ Failed to update stock");
    }
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <h2 className="sidebar-title">Tiger Mango (Web)</h2>
        <button onClick={() => setActiveTab("inventory")}>📦 Inventory</button>
        <button onClick={() => setActiveTab("history")}>📝 Purchase History</button>
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
                    {key.charAt(0).toUpperCase() + key.slice(1)}:{" "}
                    <input
                      type="number"
                      defaultValue={cups[key] ?? 0}
                      onBlur={(e) =>
                        handleStockChange("cups", key, e.target.value)
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
                    {key.charAt(0).toUpperCase() + key.slice(1)}:{" "}
                    <input
                      type="number"
                      defaultValue={straws[key] ?? 0}
                      onBlur={(e) =>
                        handleStockChange("straw", key, e.target.value)
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
                      {key.replace(/-/g, " ").replace(/\b\w/g, (c) =>
                        c.toUpperCase()
                      )}:{" "}
                      <input
                        type="number"
                        defaultValue={addons[key] ?? 0}
                        onBlur={(e) =>
                          handleStockChange("add-ons", key, e.target.value)
                        }
                      />
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="card">
            <h2>📝 Purchase History</h2>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Flavor</th>
                  <th>Size</th>
                  <th>Add-ons</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {purchaseHistory.map((order) => (
                  <tr key={order.id}>
                    <td>{order.flavor}</td>
                    <td>{order.size}</td>
                    <td>{order.addOns?.join(", ") || "-"}</td>
                    <td>{order.quantity}</td>
                    <td>₱{order.price}</td>
                    <td>
                      {order.createdAt
                        ? order.createdAt.toDate().toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
