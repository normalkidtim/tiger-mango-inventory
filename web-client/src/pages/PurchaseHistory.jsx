// src/pages/PurchaseHistory.jsx
import React, { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { FiShoppingCart, FiCalendar } from "react-icons/fi";

export default function PurchaseHistory() {
  const [orders, setOrders] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredOrders = useMemo(() => {
    if (!startDate && !endDate) return orders;
    try {
        const start = new Date(startDate + "T00:00:00");
        const end = new Date(endDate + "T23:59:59.999");
        return orders.filter((o) => {
          const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          return d >= start && d <= end;
        });
    } catch (e) {
        return orders;
    }
  }, [orders, startDate, endDate]);

  return (
    <div>
      <div className="page-header">
        <FiShoppingCart />
        <h2>Purchase History</h2>
      </div>
      <div className="page-header-underline"></div>

      <div className="filter-bar">
        <div className="filter-group">
          <FiCalendar />
          <label>From:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>To:</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        {/* ✅ Use the new button class */}
        <button className="btn btn-outline" onClick={() => { setStartDate(""); setEndDate(""); }}>
          Clear
        </button>
      </div>

      <div className="table-box">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Flavor</th>
              <th>Add-ons</th>
              <th>Size</th>
              <th>Qty</th>
              <th>Price (₱)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan="6" className="no-data">Loading orders...</td></tr>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((o) => {
                  const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
                  const addons = Array.isArray(o.addOns) ? o.addOns.join(", ") : "";
                  const total = (o.price || 0) * (o.quantity || 1);
                  return (
                    <tr key={o.id}>
                      <td>{d.toLocaleString('en-US', { timeZone: 'Asia/Manila' })}</td>
                      <td>{o.flavor}</td>
                      <td>{addons || '-'}</td>
                      <td>{o.size}</td>
                      <td>{o.quantity}</td>
                      <td>{total.toLocaleString()}</td>
                    </tr>
                  );
                })
            ) : (
              <tr>
                <td colSpan="6" className="no-data">No orders found for the selected criteria</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}