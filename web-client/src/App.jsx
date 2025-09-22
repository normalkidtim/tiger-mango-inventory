import React, { useEffect, useState } from "react";
import { db } from "./firebase"; // make sure you create firebase.js in web client too
import { doc, onSnapshot } from "firebase/firestore";
import "./App.css";

export default function App() {
  const [cups, setCups] = useState({});
  const [straws, setStraws] = useState({});
  const [addOns, setAddOns] = useState({});

  useEffect(() => {
    // ✅ Listen to cups
    const unsubCups = onSnapshot(doc(db, "inventory", "cups"), (docSnap) => {
      if (docSnap.exists()) setCups(docSnap.data());
    });

    // ✅ Listen to straws
    const unsubStraws = onSnapshot(doc(db, "inventory", "straw"), (docSnap) => {
      if (docSnap.exists()) setStraws(docSnap.data());
    });

    // ✅ Listen to add-ons
    const unsubAddOns = onSnapshot(doc(db, "inventory", "add-ons"), (docSnap) => {
      if (docSnap.exists()) setAddOns(docSnap.data());
    });

    return () => {
      unsubCups();
      unsubStraws();
      unsubAddOns();
    };
  }, []);

  return (
    <div className="app-container">
      <h1 className="title">Tiger Mango Inventory</h1>

      {/* ✅ Cups Section */}
      <div className="card">
        <h2>Cups</h2>
        <ul>
          <li>Tall: {cups.tall ?? 0}</li>
          <li>Grande: {cups.grande ?? 0}</li>
          <li>1 Liter: {cups.liter ?? 0}</li>
        </ul>
      </div>

      {/* ✅ Straws Section */}
      <div className="card">
        <h2>Straws</h2>
        <ul>
          <li>Regular: {straws.regular ?? 0}</li>
          <li>Big: {straws.big ?? 0}</li>
        </ul>
      </div>

      {/* ✅ Add-ons Section */}
      <div className="card">
        <h2>Add-ons</h2>
        <ul>
          {Object.entries(addOns).map(([key, value]) => (
            <li key={key}>
              {key.replace(/-/g, " ")}: {value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
