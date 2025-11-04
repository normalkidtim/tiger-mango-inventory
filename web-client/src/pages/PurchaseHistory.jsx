// web-client/src/pages/PurchaseHistory.jsx
import React, { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { FiShoppingCart, FiCalendar, FiCheckCircle, FiXCircle, FiUser, FiSearch } from "react-icons/fi"; 

// Helper function to format prices
const formatPrice = (price) => `₱${(price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PurchaseHistory() {
  const [orders, setOrders] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState('All'); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); 

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // UPDATED: The filter logic now includes categoryName
  const filteredOrders = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();

    return orders.filter(order => {
      // 1. Status Filter
      const isStatusMatch = filterStatus === 'All' || order.status === filterStatus;
      if (!isStatusMatch) return false;

      // 2. Date Filter
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : null;
      if (!orderDate) return false; 
      const start = startDate ? new Date(startDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      const end = endDate ? new Date(endDate) : null;
      if (end) end.setHours(23, 59, 59, 999);
      const isAfterStart = start ? orderDate >= start : true;
      const isBeforeEnd = end ? orderDate <= end : true;
      if (!(isAfterStart && isBeforeEnd)) return false;
      
      // 3. Search Term Filter
      if (lowercasedTerm === "") {
        return true; // No search term, so it passes
      }
      
      // Check cashier name
      const cashierMatch = order.cashier && order.cashier.toLowerCase().includes(lowercasedTerm);
      
      // Check item names (flavors)
      const itemMatch = order.items && order.items.some(item => 
        item.name && item.name.toLowerCase().includes(lowercasedTerm)
      );

      // --- NEW: Check category name ---
      const categoryMatch = order.items && order.items.some(item =>
        item.categoryName && item.categoryName.toLowerCase().includes(lowercasedTerm)
      );
      // --- END NEW ---

      // Check add-on names
      const addonMatch = order.items && order.items.some(item => 
        item.addons && item.addons.some(addon => {
          const addonName = addon.name || addon; // Handle old addon strings
          return addonName && addonName.toLowerCase().includes(lowercasedTerm);
        })
      );
      
      // UPDATED: Added categoryMatch
      return cashierMatch || itemMatch || addonMatch || categoryMatch;
    });
  }, [orders, startDate, endDate, filterStatus, searchTerm]); // <-- No change here, still correct
  
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
                        
                        {(item.addons && item.addons.length > 0) && (
                            <span className="item-addons-history">
                              +{item.addons.map(a => {
                                  const addonQty = a.quantity || 1; 
                                  const addonName = a.name || a;     
                                  const addonPrice = a.price || 0; 
                                  const totalAddonPrice = addonPrice * addonQty;
                                  
                                  return `${addonQty}x ${addonName} (${formatPrice(totalAddonPrice)})`;
                                }).join(', ')}
                            </span>
                        )}
                    </div>
                    
                    <span className="item-price-history">
                      {formatPrice(item.finalPrice)}
                    </span>
                </div>
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header"><FiShoppingCart /><h2>Purchase History</h2></div>
      <div className="page-header-underline"></div>

      {/* --- Search Bar --- */}
      <div className="card filter-bar">
        <div className="filter-group" style={{ width: '100%' }}>
          <FiSearch />
          <label htmlFor="search-logs" style={{ fontWeight: 600 }}>Search:</label>
          <input
            id="search-logs"
            type="text"
            // UPDATED: New placeholder
            placeholder="Search by category, flavor, cashier, or add-on..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', flex: 1, outline: 'none' }}
            className="input-field"
          />
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="card filter-bar">
        <div className="filter-group">
          <FiCalendar />
          <label>From:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
        </div>
        <div className="filter-group">
          <label>To:</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
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