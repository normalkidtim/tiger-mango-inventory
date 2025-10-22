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

  // Filter orders based on the selected date range
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : null;
      if (!orderDate) return false; // Skip if date is invalid

      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      // Adjust start date to the beginning of the day
      if (start) {
        start.setHours(0, 0, 0, 0);
      }
      // Adjust end date to the end of the day
      if (end) {
        end.setHours(23, 59, 59, 999);
      }

      const isAfterStart = start ? orderDate >= start : true;
      const isBeforeEnd = end ? orderDate <= end : true;

      return isAfterStart && isBeforeEnd;
    });
  }, [orders, startDate, endDate]);


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
            ) : filteredOrders.length === 0 ? (
                 <tr><td colSpan="3" className="no-data">No orders found for the selected date range.</td></tr>
            ) : filteredOrders.map((order) => {
              const d = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
              // ✅ Updated logic to include add-ons in the display string
              const itemsToDisplay = order.items ?
                order.items.map(item => {
                  let addonsString = "";
                  if (item.addOns && item.addOns.length > 0) {
                     // Check if addOns is defined and not empty
                    addonsString = ` (+ ${item.addOns.join(', ')})`;
                  }
                  return `${item.quantity}x ${item.flavor} (${item.size})${addonsString}`;
                }).join(', ') :
                (() => { // Fallback for old format (single item)
                    let addonsString = "";
                    if (order.addOns && order.addOns.length > 0) {
                         // Check if addOns is defined and not empty
                        addonsString = ` (+ ${order.addOns.join(', ')})`;
                    }
                    return `${order.quantity || 1}x ${order.flavor} (${order.size})${addonsString}`;
                })();
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