// web-client/src/pages/PurchaseHistory.jsx

import React, { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
// Import necessary icons, including new ones for status badges
import { FiShoppingCart, FiCalendar, FiCheckCircle, FiXCircle, FiUser } from "react-icons/fi"; 

// Helper function to format prices like the mobile client (₱xx.xx)
const formatPrice = (price) => `₱${(price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PurchaseHistory() {
  const [orders, setOrders] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState('All'); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch ALL orders ordered by creation time, descending
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Filter orders based on date range AND status
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Filter by Status
      const isStatusMatch = filterStatus === 'All' || order.status === filterStatus;
      if (!isStatusMatch) return false;

      // 2. Filter by Date Range
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : null;
      if (!orderDate) return false; 

      const start = startDate ? new Date(startDate) : null;
      if (start) {
        start.setHours(0, 0, 0, 0);
      }
      
      const end = endDate ? new Date(endDate) : null;
      if (end) {
        end.setHours(23, 59, 59, 999);
      }

      const isAfterStart = start ? orderDate >= start : true;
      const isBeforeEnd = end ? orderDate <= end : true;

      return isAfterStart && isBeforeEnd;
    });
  }, [orders, startDate, endDate, filterStatus]);
  
  // Helper Component for the Filter Buttons
  const FilterButton = ({ status, label }) => (
    <button
      className={`btn-filter ${filterStatus === status ? 'btn-active' : 'btn-outline'}`}
      onClick={() => setFilterStatus(status)}
    >
      {label}
    </button>
  );


  // Component for a single Order Card (New Card Design)
  const OrderCard = ({ order }) => {
    const d = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
    // Format timestamp including date and time
    const timestamp = d.toLocaleDateString('en-US') + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const cashierName = order.cashier || 'N/A'; // Get cashier name

    const isVoided = order.status === 'Voided';
    const StatusIcon = isVoided ? FiXCircle : FiCheckCircle;
    
    // Using the same colors as the mobile client's styles.js
    const STATUS_COLORS = {
        COMPLETED_COLOR: '#4CAF50',
        VOIDED_COLOR: 'var(--primary-brand)', 
    }
    const statusColor = isVoided ? STATUS_COLORS.VOIDED_COLOR : STATUS_COLORS.COMPLETED_COLOR; 
    const statusBgColor = isVoided ? 'rgba(229, 57, 53, 0.1)' : 'rgba(76, 175, 80, 0.1)';

    return (
      <div className="order-card-history">
        {/* Header with Status Badge and Timestamp */}
        <div className="card-header-history">
          <div className="status-badge" style={{ backgroundColor: statusBgColor }}>
             <StatusIcon size={16} style={{ color: statusColor }} />
             <span className="status-text" style={{ color: statusColor }}>{order.status}</span>
          </div>
          <span className="timestamp-text">
            <FiCalendar size={12} style={{ marginRight: '5px' }} /> {timestamp}
          </span>
        </div>
        
        {/* NEW: Cashier Row */}
        <div className="content-row-history" style={{ marginBottom: '5px' }}>
            <span className="order-total-text" style={{ fontWeight: '600' }}><FiUser size={14} style={{ marginRight: '5px' }} /> Cashier:</span>
            <span className="order-total-value" style={{ fontWeight: 'normal' }}>{cashierName}</span>
        </div>

        {/* Total Price Row */}
        <div className="content-row-history">
            <span className="order-total-text">Total Price:</span>
            <span className="order-total-value">{formatPrice(order.totalPrice)}</span>
        </div>

        {/* Items Container */}
        <div className="items-container-history">
            {(order.items || []).map((item, index) => (
                <div key={index} className="item-row-history">
                    <div className="item-details-history">
                        {/* Mobile client uses an explicit category name, which is supported by the order data */}
                        <span className="item-category-name">{item.categoryName}</span>
                        <span className="item-name-history">{item.quantity}x {item.name} ({item.size})</span>
                    </div>
                    {(item.addons && item.addons.length > 0) && (
                        // MODIFIED: Show add-on quantity
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

      {/* Date Range Filter Bar (Kept from old design) */}
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
          Clear Date Filter
        </button>
      </div>

      {/* Status Filter Bar (New, matching mobile layout) */}
      <div className="filter-bar status-filter-bar">
          <FilterButton status="All" label="All" />
          <FilterButton status="Completed" label="Completed" />
          <FilterButton status="Voided" label="Voided" />
      </div>

      {/* List of Cards */}
      <div className="history-list-container">
        {loading ? (
            <p className="no-data">Loading...</p>
        ) : filteredOrders.length === 0 ? (
            <p className="no-data">No orders found for the selected filter criteria.</p>
        ) : (
            filteredOrders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
}