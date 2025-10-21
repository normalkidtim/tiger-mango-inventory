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
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ... (keep filtering logic)

  return (
    <div>
      <div className="page-header"><FiShoppingCart /><h2>Purchase History</h2></div>
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
        <button className="btn btn-outline" onClick={() => { setStartDate(""); setEndDate(""); }}>
          Clear
        </button>
      </div>

      <div className="table-box">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Items in Order</th>
              <th>Total Price (₱)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan="3" className="no-data">Loading...</td></tr>
            ) : orders.map((order) => {
              const d = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
              // ✅ This logic now handles BOTH old (single item) and new (multi-item) order formats
              const itemsToDisplay = order.items ? 
                order.items.map(item => `${item.quantity}x ${item.flavor} (${item.size})`).join(', ') :
                `${order.quantity || 1}x ${order.flavor} (${order.size})`; // Fallback for old format
              const priceToDisplay = order.totalPrice !== undefined ? order.totalPrice : order.price;

              return (
                <tr key={order.id}>
                  <td>{d.toLocaleString('en-US', { timeZone: 'Asia/Manila' })}</td>
                  <td>{itemsToDisplay}</td>
                  <td>{priceToDisplay ? priceToDisplay.toLocaleString() : 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}