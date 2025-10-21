import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../AuthContext";
import { FiGrid, FiBox, FiFilter, FiPackage } from "react-icons/fi";
import "../assets/styles/inventory.css";

const getDisplayName = (key) => key.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

export default function Inventory() {
  const { currentUser } = useAuth();
  const [cups, setCups] = useState({});
  const [straws, setStraws] = useState({});
  const [addons, setAddons] = useState({});

  useEffect(() => {
    const unsubCups = onSnapshot(doc(db, "inventory", "cups"), (docSnap) => setCups(docSnap.data() || {}));
    const unsubStraws = onSnapshot(doc(db, "inventory", "straw"), (docSnap) => setStraws(docSnap.data() || {}));
    const unsubAddons = onSnapshot(doc(db, "inventory", "add-ons"), (docSnap) => setAddons(docSnap.data() || {}));
    return () => { unsubCups(); unsubStraws(); unsubAddons(); };
  }, []);
  
  const handleStockChange = (category, field, value) => {
    const numericValue = Number(value);
    if (isNaN(numericValue)) return;

    if (category === 'cups') setCups(prev => ({...prev, [field]: numericValue}));
    if (category === 'straw') setStraws(prev => ({...prev, [field]: numericValue}));
    if (category === 'add-ons') setAddons(prev => ({...prev, [field]: numericValue}));
  };
  
  const updateStockInFirebase = async (category, docName, field, value) => {
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
        <InventoryCard title="Cups" items={cups} icon={<FiBox />} onChange={(field, value) => handleStockChange('cups', field, value)} onUpdate={(field, value) => updateStockInFirebase("inventory", "cups", field, value)} />
        <InventoryCard title="Straws" items={straws} icon={<FiFilter />} onChange={(field, value) => handleStockChange('straw', field, value)} onUpdate={(field, value) => updateStockInFirebase("inventory", "straw", field, value)} />
        <InventoryCard title="Add-ons" items={addons} icon={<FiPackage />} onChange={(field, value) => handleStockChange('add-ons', field, value)} onUpdate={(field, value) => updateStockInFirebase("inventory", "add-ons", field, value)} />
      </div>
    </div>
  );
}

function InventoryCard({ title, items, icon, onChange, onUpdate }) {
  const itemArray = Object.entries(items).map(([key, value]) => ({ id: key, name: getDisplayName(key), stock: value }));

  return (
    <div className="inventory-card">
      <div className="inventory-card-header">{icon}{title}</div>
      <div className="inventory-item-list">
        {itemArray.length > 0 ? itemArray.map((item) => (
          <div className="inventory-item" key={item.id}>
            <span className="inventory-item-name">{item.name}</span>
            <div className="inventory-item-stock">
              <input 
                type="number" 
                value={item.stock}
                onChange={(e) => onChange(item.id, e.target.value)}
                onBlur={(e) => onUpdate(item.id, e.target.value)}
              />
            </div>
          </div>
        )) : <p className="no-items-message">Loading stock...</p>}
      </div>
    </div>
  );
}