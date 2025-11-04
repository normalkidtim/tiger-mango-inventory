// web-client/src/pages/PurchaseHistory.jsx
import React, { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { FiShoppingCart, FiCalendar, FiCheckCircle, FiXCircle, FiUser } from "react-icons/fi"; 

// Helper function to format prices
const formatPrice = (price) => `₱${(price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PurchaseHistory() {
  const [orders, setOrders] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState('All'); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const isStatusMatch = filterStatus === 'All' || order.status === filterStatus;
      if (!isStatusMatch) return false;

      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : null;
      if (!orderDate) return false; 

      const start = startDate ? new Date(startDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      
      const end = endDate ? new Date(endDate) : null;
      if (end) end.setHours(23, 59, 59, 999);

      const isAfterStart = start ? orderDate >= start : true;
      const isBeforeEnd = end ? orderDate <= end : true;

      return isAfterStart && isBeforeEnd;
    });
  }, [orders, startDate, endDate, filterStatus]);
  
  const FilterButton = ({ status, label }) => (
    <button
      className={`btn-filter ${filterStatus === status ? 'btn-active' : ''}`}
      onClick={() => setFilterStatus(status)}
    >
      {label}
    </button>
  );

  const OrderCard = ({ order }) => {
    const d = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
    const timestamp = d.toLocaleDateString('en-US') + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const cashierName = order.cashier || 'N/A';
    const isVoided = order.status === 'Voided';
    
    const statusClassName = isVoided ? 'voided' : 'completed';
    const StatusIcon = isVoided ? FiXCircle : FiCheckCircle;

    return (
      <div className="card">
        {/* Header with Status Badge and Timestamp */}
        <div className="card-header-history">
          <div className={`status-badge ${statusClassName}`}>
             <StatusIcon size={16} />
             <span>{order.status}</span>
          </div>
          <span className="timestamp-text">
            <FiCalendar size={12} /> {timestamp}
          </span>
        </div>
        
        {/* Body with Cashier and Total */}
        <div className="card-body-history">
            <div className="content-row-history">
                <span className="label"><FiUser size={14} /> Cashier:</span>
                <span className="value">{cashierName}</span>
            </div>
            <div className="content-row-history">
                <span className="label">Total Price:</span>
                <span className="value total">{formatPrice(order.totalPrice)}</span>
            </div>
        </div>

        {/* Footer (Items Container) */}
        <div className="items-container-history">
            {(order.items || []).map((item, index) => (
                <div key={index} className="item-row-history">
                    <div className="item-details-history">
                        <span className="item-category-name">{item.categoryName}</span>
                        <span className="item-name-history">{item.quantity}x {item.name} ({item.size})</span>
                    </div>
                    {(item.addons && item.addons.length > 0) && (
                        <span className="item-addons-history">+{item.addons.map(a => `${a.quantity}x ${a.name}`).join(', ')}</span>
                    )}
                </div>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header"><FiShoppingCart /><h2>Purchase History</h2></div>
      <div className="page-header-underline"></div>

      {/* Date Range Filter Bar */}
      <div className="card filter-bar">
        <div className="filter-group">
          <FiCalendar />
          <label>From:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>To:</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button className="btn-filter btn-outline" onClick={() => { setStartDate(""); setEndDate(""); }}>
          Clear Dates
        </button>
      </div>

      {/* Status Filter Bar */}
      <div className="card filter-bar status-filter-bar">
          <FilterButton status="All" label="All" />
          <FilterButton status="Completed" label="Completed" />
          <FilterButton status="Voided" label="Voided" />
      </div>

      {/* List of Cards */}
      <div className="history-list-container">
        {loading ? (
            <p className="no-data">Loading...</p>
        ) : filteredOrders.length === 0 ? (
            <div className="card">
                <div className="card-body">
                    <p className="no-data" style={{padding: 0}}>No orders found for the selected filter criteria.</p>
                </div>
            </div>
        ) : (
            filteredOrders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
}