import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function InventoryDashboard() {
  const [cups, setCups] = useState({});
  const [straws, setStraws] = useState({});
  const [addOns, setAddOns] = useState({});

  // ✅ Listen to Firestore in real time
  useEffect(() => {
    const unsubCups = onSnapshot(doc(db, "inventory", "cups"), (docSnap) => {
      setCups(docSnap.data() || {});
    });

    const unsubStraws = onSnapshot(doc(db, "inventory", "straw"), (docSnap) => {
      setStraws(docSnap.data() || {});
    });

    const unsubAddOns = onSnapshot(doc(db, "inventory", "add-ons"), (docSnap) => {
      setAddOns(docSnap.data() || {});
    });

    return () => {
      unsubCups();
      unsubStraws();
      unsubAddOns();
    };
  }, []);

  return (
    <div className="min-h-screen bg-red-600 text-white p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Tiger Mango Inventory</h1>

      {/* Cups */}
      <div className="bg-white text-black rounded-xl p-6 mb-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Cups</h2>
        <ul className="space-y-2">
          <li>Tall: {cups.tall ?? 0}</li>
          <li>Grande: {cups.grande ?? 0}</li>
          <li>1 Liter: {cups.liter ?? 0}</li>
        </ul>
      </div>

      {/* Straws */}
      <div className="bg-white text-black rounded-xl p-6 mb-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Straws</h2>
        <ul className="space-y-2">
          <li>Regular: {straws.regular ?? 0}</li>
          <li>Big: {straws.big ?? 0}</li>
        </ul>
      </div>

      {/* Add-ons */}
      <div className="bg-white text-black rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Add-ons</h2>
        <ul className="space-y-2">
          {Object.entries(addOns).map(([key, value]) => (
            <li key={key}>
              {key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}: {value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
