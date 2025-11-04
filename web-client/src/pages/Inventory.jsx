// web-client/src/pages/Inventory.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  collection, 
  serverTimestamp, 
  setDoc, 
  deleteDoc, 
  deleteField,
  query,
} from "firebase/firestore";
import { useAuth } from "../AuthContext";
import { FiGrid, FiBox, FiPackage, FiPlus, FiAlertCircle, FiTrash2 } from "react-icons/fi"; 

// Helper function to format keys
const getDisplayName = (key) => key.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const slugify = (text) => text.toLowerCase().replace(/\s/g, '-').replace(/[^a-z0-9-]/g, '');

export default function Inventory() {
  const { currentUser } = useAuth();
  const [inventoryData, setInventoryData] = useState({}); 
  const [loading, setLoading] = useState(true);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(''); 
  const [saveStatus, setSaveStatus] = useState('');
  
  const categoryIcons = {
    cups: FiBox,
    lids: FiPackage,
    straws: FiAlertCircle,
    'add-ons': FiPlus,
  };

  useEffect(() => {
    const q = query(collection(db, 'inventory'));
    const unsub = onSnapshot(q, (querySnapshot) => {
      const data = {};
      querySnapshot.forEach((docSnap) => {
        data[docSnap.id] = docSnap.data();
      });
      setInventoryData(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching inventory:", error);
      setLoading(false);
      setSaveStatus('❌ Failed to load inventory categories.');
    });
    return () => unsub();
  }, []);
  
  const updateStockInFirebase = async (docId, field, value) => {
    const numericValue = Number(value);
    if (isNaN(numericValue) || numericValue < 0) return;
    
    try {
      await updateDoc(doc(db, 'inventory', docId), {
        [field]: numericValue,
      });
      
      setInventoryData(prev => ({
        ...prev,
        [docId]: {
          ...prev[docId],
          [field]: numericValue,
        }
      }));

      await addDoc(collection(db, "stock-logs"), {
        item: `${docId} - ${getDisplayName(field)}`,
        newValue: numericValue,
        user: currentUser?.email || 'unknown',
        timestamp: serverTimestamp(),
      });
    } catch (error) { 
      console.error("Error updating stock:", error);
      setSaveStatus(`❌ Error updating ${docId}: ${error.message}`);
      setTimeout(() => setSaveStatus(''), 5000);
    }
  };
  
  const handleAddNewCategory = async () => {
    const trimmedName = newCategoryName.trim();
    const docId = slugify(trimmedName);
    if (!trimmedName || inventoryData[docId]) {
      alert('Invalid or duplicate category name.');
      return;
    }
    try {
        await setDoc(doc(db, 'inventory', docId), {}); 
        setNewCategoryName('');
        setSaveStatus(`✅ New stock category "${trimmedName}" created!`);
    } catch (error) {
        console.error("Error creating new category:", error);
        setSaveStatus(`❌ Error creating new category: ${error.message}`);
        setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  const handleAddNewItem = async () => {
    const docId = newItemCategory;
    const trimmedName = newItemName.trim();
    const fieldName = slugify(trimmedName);
    if (!docId || !trimmedName) {
      alert('Select a category and enter an item name.');
      return;
    }
    if (inventoryData[docId] && inventoryData[docId][fieldName] !== undefined) {
      alert(`Item "${trimmedName}" already exists in this category.`);
      return;
    }
    try {
        await updateDoc(doc(db, 'inventory', docId), { [fieldName]: 0 });
        setNewItemName('');
        setNewItemCategory('');
        setSaveStatus(`✅ New item "${trimmedName}" added to ${getDisplayName(docId)}!`);
    } catch (error) {
        console.error("Error adding new item:", error);
        setSaveStatus(`❌ Error adding new item: ${error.message}`);
        setTimeout(() => setSaveStatus(''), 5000);
    }
  };
  
  const handleDeleteCategory = async (docId, categoryName) => {
    if (!window.confirm(`WARNING: This will permanently delete the entire "${categoryName}" inventory category and all its stock levels. Continue?`)) return;
    try {
        await deleteDoc(doc(db, 'inventory', docId));
        setSaveStatus(`🗑️ Stock category "${categoryName}" deleted successfully.`);
    } catch (error) {
        console.error("Error deleting category:", error);
        setSaveStatus(`❌ Error deleting category: ${error.message}`);
        setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  const handleDeleteItem = async (docId, field, itemName) => {
    if (!window.confirm(`Are you sure you want to delete the item "${itemName}" from ${getDisplayName(docId)}? This will delete its stock level forever.`)) return;
    try {
        await updateDoc(doc(db, 'inventory', docId), { [field]: deleteField() });
        setSaveStatus(`🗑️ Item "${itemName}" deleted successfully.`);
    } catch (error) {
        console.error("Error deleting item:", error);
        setSaveStatus(`❌ Error deleting item: ${error.message}`);
        setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  if (loading) {
      return (
          <div className="page-container"> {/* ADDED WRAPPER */}
              <div className="page-header"><FiGrid /><h2>Inventory Overview</h2></div>
              <div className="page-header-underline"></div>
              <p className="no-data">Loading inventory data...</p>
          </div>
      );
  }

  const availableCategories = Object.keys(inventoryData).sort((a, b) => a.localeCompare(b.name));

  return (
    <div className="page-container"> {/* ADDED WRAPPER */}
      <div className="page-header"><FiGrid /><h2>Inventory Overview</h2></div>
      <div className="page-header-underline"></div>
      
      {saveStatus && (
        <div className={saveStatus.startsWith('❌') ? 'error-message' : 'success-message'}>
            {saveStatus}
        </div>
      )}

      {/* --- ADD NEW CATEGORY & ITEM FORMS --- */}
      <div className="form-row-2-col" style={{ marginBottom: '24px' }}>
        
        {/* Add New Stock Category (Document) */}
        <div className="card">
          <div className="card-header">
            <h3><FiBox /> Add New Stock Category</h3>
          </div>
          <div className="card-body">
            <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Category Name (e.g., "Paper Bags")</label>
                <input 
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter new stock category name"
                    className="input-field"
                />
            </div>
          </div>
          <div className="card-footer">
            <button 
                onClick={handleAddNewCategory} 
                className="btn btn-primary"
                disabled={!newCategoryName.trim()}
                style={{ width: '100%' }}
            >
                <FiPlus /> Create Category
            </button>
          </div>
        </div>

        {/* Add New Item Type (Field) */}
        <div className="card">
          <div className="card-header">
            <h3><FiPlus /> Add New Item Type</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
                <label>Select Existing Category</label>
                <select 
                    value={newItemCategory} 
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="input-field"
                >
                    <option value="" disabled>Select category...</option>
                    {availableCategories.map(catId => (
                        <option key={catId} value={catId}>{getDisplayName(catId)}</option>
                    ))}
                </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Item Name (e.g., "Bamboo Straw")</label>
                <input 
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="New item name"
                    className="input-field"
                />
            </div>
          </div>
          <div className="card-footer">
            <button 
                onClick={handleAddNewItem} 
                className="btn btn-secondary"
                disabled={!newItemCategory || !newItemName.trim()}
                style={{ width: '100%' }}
            >
                <FiPlus /> Add Item
            </button>
          </div>
        </div>
      </div>

      {/* --- INVENTORY LISTING (DYNAMICALLY GENERATED) --- */}
      <div className="inventory-sections">
        {availableCategories.map(docId => {
          const categoryName = getDisplayName(docId);
          const CategoryIcon = categoryIcons[docId] || FiBox;
          
          return (
            <InventoryCard 
              key={docId}
              title={categoryName}
              items={inventoryData[docId]} 
              icon={<CategoryIcon />}
              docId={docId}
              onUpdate={updateStockInFirebase}
              onDelete={handleDeleteCategory}
              onDeleteItem={handleDeleteItem} 
            />
          );
        })}
      </div>
    </div>
  );
}

// Separate component for each inventory card
function InventoryCard({ title, items, icon, docId, onUpdate, onDelete, onDeleteItem }) {
  const itemArray = Object.entries(items)
    .map(([key, value]) => ({ id: key, name: getDisplayName(key), stock: value }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="card">
      <div className="card-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
        <h3>{icon} {title}</h3>
        <button 
          onClick={() => onDelete(docId, title)}
          className="btn-danger"
          style={{ height: '36px', padding: '0 10px', fontSize: '0.9rem' }}
          title={`Delete the entire ${title} category`}
        >
          <FiTrash2 size={16} />
        </button>
      </div>
      <div className="card-body" style={{ padding: '0 24px 24px 24px' }}>
        <div className="inventory-item-list">
          {itemArray.length > 0 ? itemArray.map((item) => (
            <div className="inventory-item" key={item.id}>
              <span className="inventory-item-name">{item.name}</span>
              <div className="inventory-item-stock">
                <input 
                  type="number" 
                  defaultValue={item.stock}
                  onBlur={(e) => onUpdate(docId, item.id, e.target.value)} // Corrected: Pass docId
                />
                <button 
                  onClick={() => onDeleteItem(docId, item.id, item.name)}
                  className="inventory-delete-btn"
                  title={`Delete ${item.name} item`}
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          )) : <p className="no-items-message">No items. Use the form above to add one.</p>}
        </div>
      </div>
    </div>
  );
}