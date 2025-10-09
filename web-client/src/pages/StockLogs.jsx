// src/pages/StockLogs.jsx
import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { FiFileText, FiSearch } from "react-icons/fi";
import "../assets/styles/tables.css";

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
    <div>
      <div className="page-header">
        <FiFileText />
        <h2>Stock Update Logs</h2>
      </div>
      <div className="page-header-underline"></div>

      {/* ✅ Added the search filter bar */}
      <div className="filter-bar">
        <div className="filter-group" style={{ width: '100%' }}>
          <FiSearch />
          <input
            type="text"
            placeholder="Search by item or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', outline: 'none' }}
          />
        </div>
      </div>

      <div className="table-box">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>New Value</th>
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
                  <td>{log.newValue}</td>
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
  );
}