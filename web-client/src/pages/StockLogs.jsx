// src/pages/StockLogs.jsx
import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { FiFileText, FiSearch, FiArrowRight } from "react-icons/fi";

export default function StockLogs() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "stock-logs"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredLogs = useMemo(() => {
    if (!searchTerm) {
      return logs;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return logs.filter(log =>
      (log.item && log.item.toLowerCase().includes(lowercasedTerm)) ||
      (log.user && log.user.toLowerCase().includes(lowercasedTerm))
    );
  }, [logs, searchTerm]);

  return (
    <div className="page-container">
      <div className="page-header">
        <FiFileText />
        <h2>Stock Update Logs</h2>
      </div>
      <div className="page-header-underline"></div>

      {/* Search filter bar */}
      <div className="card filter-bar">
        <div className="filter-group" style={{ width: '100%' }}>
          <FiSearch />
          <label htmlFor="search-logs" style={{ fontWeight: 600 }}>Search:</label>
          <input
            id="search-logs"
            type="text"
            placeholder="Search by item or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', flex: 1, outline: 'none' }}
            className="input-field"
          />
        </div>
      </div>

      <div className="card no-padding">
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Change</th>
                <th>User</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
            {loading ? (
                <tr><td colSpan="4" className="no-data">Loading logs...</td></tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.item}</td>
                    
                    {/* UPDATED: Show Old -> New change */}
                    <td style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                      {/* Show 'N/A' for old logs that didn't track this */}
                      <span style={{ color: 'var(--c-text-secondary)', fontSize: '0.9em' }}>
                        {log.oldValue ?? 'N/A'}
                      </span>
                      
                      <FiArrowRight size={14} color="var(--c-brand)" />
                      
                      <span style={{ color: 'var(--c-text-primary)', fontWeight: '600', fontSize: '1.05em' }}>
                        {log.newValue}
                      </span>
                    </td>
                    
                    <td>{log.user}</td>
                    <td>{log.timestamp?.toDate().toLocaleString('en-US', { timeZone: 'Asia/Manila' })}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">
                    No stock logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}