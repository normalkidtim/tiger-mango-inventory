import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../AuthContext";
import { FiGrid, FiBox, FiFilter, FiPackage } from "react-icons/fi";
import "../assets/styles/inventory.css";

const getDisplayName = (key) => key.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const processInventoryDoc = (docSnap) => {
  if (!docSnap.exists()) return [];
  const data = docSnap.data();
  return Object.entries(data).map(([key, value]) => ({ id: key, name: getDisplayName(key), stock: value }));
};

export default function Inventory() {
  const { currentUser } = useAuth();
  const [cups, setCups] = useState([]);
  const [straws, setStraws] = useState([]);
  const [addons, setAddons] = useState([]);

  useEffect(() => {
    const unsubCups = onSnapshot(doc(db, "inventory", "cups"), (docSnap) => setCups(processInventoryDoc(docSnap)));
    const unsubStraws = onSnapshot(doc(db, "inventory", "straw"), (docSnap) => setStraws(processInventoryDoc(docSnap)));
    const unsubAddons = onSnapshot(doc(db, "inventory", "add-ons"), (docSnap) => setAddons(processInventoryDoc(docSnap)));
    return () => { unsubCups(); unsubStraws(); unsubAddons(); };
  }, []);
  
  const updateStock = async (category, docName, field, value) => {
    try {
      const numericValue = Number(value);
      if (isNaN(numericValue) || numericValue < 0) return;
      await updateDoc(doc(db, category, docName), { [field]: numericValue });
      await addDoc(collection(db, "stock-logs"), {
        item: `${docName} - ${field}`,
        newValue: numericValue,
        user: currentUser?.displayName || currentUser?.email || 'unknown',
        timestamp: serverTimestamp(),
      });
    } catch (error) { console.error("Error updating stock:", error); }
  };

  return (
    <div>
      <div className="page-header"><FiGrid /><h2>Inventory Overview</h2></div>
      <div className="page-header-underline"></div>
      <div className="inventory-sections">
        <InventoryCard title="Cups" items={cups} icon={<FiBox />} onUpdate={(field, value) => updateStock("inventory", "cups", field, value)} />
        <InventoryCard title="Straws" items={straws} icon={<FiFilter />} onUpdate={(field, value) => updateStock("inventory", "straw", field, value)} />
        <InventoryCard title="Add-ons" items={addons} icon={<FiPackage />} onUpdate={(field, value) => updateStock("inventory", "add-ons", field, value)} />
      </div>
    </div>
  );
}

function InventoryCard({ title, items, icon, onUpdate }) {
  return (
    <div className="inventory-card">
      <div className="inventory-card-header">{icon}{title}</div>
      {items.length > 0 ? (
        <div className="inventory-item-list">
          {items.map((item) => (
            <div className="inventory-item" key={item.id}>
              <span className="inventory-item-name">{item.name}</span>
              <div className="inventory-item-stock">
                <input type="number" defaultValue={item.stock} onBlur={(e) => onUpdate(item.id, e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      ) : <p className="no-items-message">No items found</p>}
    </div>
  );
}