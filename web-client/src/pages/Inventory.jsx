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
import "../assets/styles/inventory.css";

// Helper function to format keys like 'large-cup' to 'Large Cup'
const getDisplayName = (key) => key.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const slugify = (text) => text.toLowerCase().replace(/\s/g, '-').replace(/[^a-z0-9-]/g, '');

export default function Inventory() {
  const { currentUser } = useAuth();
  // State is an object mapping docId (category) to its items
  const [inventoryData, setInventoryData] = useState({}); 
  const [loading, setLoading] = useState(true);
  
  // States for management forms
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

  // 1. Fetch data from the 'inventory' collection (separate documents)
  useEffect(() => {
    // We listen to the entire 'inventory' collection
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
  

  // 2. Core function to update stock and log the change
  const updateStockInFirebase = async (docId, field, value) => {
    const numericValue = Number(value);
    if (isNaN(numericValue) || numericValue < 0) return;
    
    try {
      // Update the specific document in the 'inventory' collection
      await updateDoc(doc(db, 'inventory', docId), {
        [field]: numericValue,
      });
      
      // Optimistically update local state
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
  
  // 3. Add New Stock Category (Adds a new document to 'inventory' collection)
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

  // 4. Add New Item Type (Adds a new field inside an 'inventory' document)
  const handleAddNewItem = async () => {
    const docId = newItemCategory; // The category docId
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
        // Update the existing document with a new field/item
        await updateDoc(doc(db, 'inventory', docId), {
            [fieldName]: 0,
        });
        
        setNewItemName('');
        setNewItemCategory('');
        setSaveStatus(`✅ New item "${trimmedName}" added to ${getDisplayName(docId)}!`);
    } catch (error) {
        console.error("Error adding new item:", error);
        setSaveStatus(`❌ Error adding new item: ${error.message}`);
        setTimeout(() => setSaveStatus(''), 5000);
    }
  };
  
  // 5. Delete Stock Category (Removes a document from 'inventory' collection)
  const handleDeleteCategory = async (docId, categoryName) => {
    if (!window.confirm(`WARNING: This will permanently delete the entire "${categoryName}" inventory category and all its stock levels. Continue?`)) return;

    try {
        // Delete the document from the 'inventory' collection
        await deleteDoc(doc(db, 'inventory', docId));
        setSaveStatus(`🗑️ Stock category "${categoryName}" deleted successfully.`);
    } catch (error) {
        console.error("Error deleting category:", error);
        setSaveStatus(`❌ Error deleting category: ${error.message}`);
        setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  // 6. Delete Item from Category (Deletes a field inside an 'inventory' document)
  const handleDeleteItem = async (docId, field, itemName) => {
    if (!window.confirm(`Are you sure you want to delete the item "${itemName}" from ${getDisplayName(docId)}? This will delete its stock level forever.`)) return;

    try {
        // Delete the specific field within the document
        await updateDoc(doc(db, 'inventory', docId), {
            [field]: deleteField(),
        });

        setSaveStatus(`🗑️ Item "${itemName}" deleted successfully.`);
    } catch (error) {
        console.error("Error deleting item:", error);
        setSaveStatus(`❌ Error deleting item: ${error.message}`);
        setTimeout(() => setSaveStatus(''), 5000);
    }
  };


  if (loading) {
      return (
          <div>
              <div className="page-header"><FiGrid /><h2>Inventory Overview</h2></div>
              <div className="page-header-underline"></div>
              <p className="no-data">Loading inventory data...</p>
          </div>
      );
  }

  const availableCategories = Object.keys(inventoryData);

  return (
    <div>
      <div className="page-header"><FiGrid /><h2>Inventory Overview</h2></div>
      <div className="page-header-underline"></div>
      
      {saveStatus && (
        <div className={saveStatus.startsWith('❌') ? 'error-message' : 'success-message'} style={{ padding: '10px', marginBottom: '15px' }}>
            {saveStatus}
        </div>
      )}

      {/* --- ADD NEW CATEGORY & ITEM FORMS --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
        
        {/* Add New Stock Category (Document) */}
        <div className="manager-form-container">
            <h3><FiBox /> Add New Stock Category</h3>
            <div className="form-group-item">
                <label>Category Name (e.g., "Paper Bags")</label>
                <input 
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter new stock category name"
                    className="input-field"
                />
            </div>
            <button 
                onClick={handleAddNewCategory} 
                className="btn-add-action btn-add-primary"
                disabled={!newCategoryName.trim()}
            >
                + Create Category
            </button>
        </div>

        {/* Add New Item Type (Field) */}
        <div className="manager-form-container">
            <h3><FiPlus /> Add New Item Type to Category</h3>
            <div className="form-group-item">
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

            <div className="form-group-item">
                <label>Item Name (e.g., "Bamboo Straw" or "Small Napkin")</label>
                <input 
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="New item name"
                    className="input-field"
                />
            </div>

            <button 
                onClick={handleAddNewItem} 
                className="btn-add-action btn-add-secondary"
                disabled={!newItemCategory || !newItemName.trim()}
            >
                + Add Item
            </button>
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
              // items is the data object from the document
              items={inventoryData[docId]} 
              icon={<CategoryIcon />}
              docId={docId}
              onUpdate={(field, value) => updateStockInFirebase(docId, field, value)}
              onDelete={() => handleDeleteCategory(docId, categoryName)}
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
  const itemArray = Object.entries(items).map(([key, value]) => ({ id: key, name: getDisplayName(key), stock: value }));

  return (
    <div className="inventory-card">
      <div className="inventory-card-header">
        {icon}
        {title}
        {/* Delete Category Button */}
        <button 
          onClick={onDelete}
          style={{ marginLeft: 'auto', backgroundColor: '#D32F2F', color: 'white', padding: '5px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
          title={`Delete the entire ${title} category`}
        >
          <FiTrash2 />
        </button>
      </div>
      <div className="inventory-item-list">
        {itemArray.length > 0 ? itemArray.map((item) => (
          <div className="inventory-item" key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <span className="inventory-item-name">{item.name}</span>
            <div className="inventory-item-stock" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="number" 
                defaultValue={item.stock}
                onBlur={(e) => onUpdate(item.id, e.target.value)}
              />
              {/* Delete Item Button */}
              <button 
                onClick={() => onDeleteItem(docId, item.id, item.name)}
                style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', padding: '0', marginLeft: '5px' }}
                title={`Delete ${item.name} item`}
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>
        )) : <p className="no-items-message">No items. Use the form above to add one.</p>}
      </div>
    </div>
  );
}