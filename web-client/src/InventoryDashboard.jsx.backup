import React, { useEffect, useState } from "react";
import { collection, onSnapshot, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export default function InventoryDashboard() {
  const [cups, setCups] = useState({});
  const [straws, setStraws] = useState({});
  const [addons, setAddons] = useState({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "inventory"), (snap) => {
      snap.forEach((docSnap) => {
        if (docSnap.id === "cups") setCups(docSnap.data());
        if (docSnap.id === "straw") setStraws(docSnap.data());
        if (docSnap.id === "add-ons") setAddons(docSnap.data());
      });
    });
    return () => unsub();
  }, []);

  // ✅ Update stock + log it
  const updateStock = async (collectionName, field, value, user = "admin") => {
    try {
      const numericValue = Number(value);

      // Update the inventory collection
      await updateDoc(doc(db, "inventory", collectionName), {
        [field]: numericValue,
      });

      // Add a log entry
      await addDoc(collection(db, "stock-logs"), {
        item: `${collectionName} - ${field}`,
        newValue: numericValue,
        user,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Inventory Dashboard (Web Client)</h1>

      {/* Cups */}
      <div>
        <h2>Cups</h2>
        {["tall", "grande", "liter"].map((key) => (
          <div key={key}>
            {key.charAt(0).toUpperCase() + key.slice(1)}:{" "}
            <input
              type="number"
              defaultValue={cups[key] ?? 0}
              onBlur={(e) => updateStock("cups", key, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Straws */}
      <div>
        <h2>Straws</h2>
        {["regular", "big"].map((key) => (
          <div key={key}>
            {key.charAt(0).toUpperCase() + key.slice(1)}:{" "}
            <input
              type="number"
              defaultValue={straws[key] ?? 0}
              onBlur={(e) => updateStock("straw", key, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Add-ons */}
      <div>
        <h2>Add-ons</h2>
        {Object.keys(addons)
          .sort()
          .map((key) => (
            <div key={key}>
              {key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}:{" "}
              <input
                type="number"
                defaultValue={addons[key] ?? 0}
                onBlur={(e) => updateStock("add-ons", key, e.target.value)}
              />
            </div>
          ))}
      </div>
    </div>
  );
}
