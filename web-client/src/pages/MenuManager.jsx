// web-client/src/pages/MenuManager.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { FiEdit, FiSave, FiAlertCircle, FiTrash2 } from 'react-icons/fi'; // ✅ ADDED FiTrash2
import '../assets/styles/tables.css';

export default function MenuManager() {
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // New states for adding items
  const [newCatName, setNewCatName] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdCatId, setNewProdCatId] = useState('');
  const [newProdPriceM, setNewProdPriceM] = useState('');
  const [newProdPriceL, setNewProdPriceL] = useState('');

  // 1. Fetch menu data from Firestore
  useEffect(() => {
    const docRef = doc(db, 'config', 'menu');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure data is initialized correctly, even if arrays are missing/null in DB
        setMenu({ categories: data.categories || [], addons: data.addons || [] });
      } else {
        // Handle case where document is truly missing or empty
        setMenu({ categories: [], addons: [] });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Handle changes to the state
  const handleAddonPriceChange = (id, newPrice) => {
    const updatedAddons = menu.addons.map(addon => 
      addon.id === id ? { ...addon, price: Number(newPrice) } : addon
    );
    setMenu(prev => ({ ...prev, addons: updatedAddons }));
  };

  const handleProductPriceChange = (catId, prodId, size, newPrice) => {
    const updatedCategories = menu.categories.map(category => {
      if (category.id === catId) {
        const updatedProducts = category.products.map(product => {
          if (product.id === prodId) {
            // Ensure prices object exists before updating size
            const newPrices = { ...product.prices, [size]: Number(newPrice) };
            // Optional: Remove size if price is empty/zero
            if (Number(newPrice) <= 0) delete newPrices[size];
            return { ...product, prices: newPrices };
          }
          return product;
        });
        return { ...category, products: updatedProducts };
      }
      return category;
    });
    setMenu(prev => ({ ...prev, categories: updatedCategories }));
  };
  
  // ✅ NEW: Function to delete a specific product (flavor)
  const handleDeleteProduct = (catId, prodId) => {
    if (!window.confirm("Are you sure you want to delete this flavor? This cannot be undone.")) return;

    const updatedCategories = menu.categories.map(category => {
        if (category.id === catId) {
            const remainingProducts = category.products.filter(product => product.id !== prodId);
            return { ...category, products: remainingProducts };
        }
        return category;
    });
    setMenu(prev => ({ ...prev, categories: updatedCategories }));
    // Immediately save the changes to the database
    handleSaveMenu();
  };

  // ✅ NEW: Function to delete an entire category
  const handleDeleteCategory = (catId, catName) => {
    if (!window.confirm(`Are you sure you want to delete the entire category: ${catName}? This will remove all flavors inside it.`)) return;
    
    const remainingCategories = menu.categories.filter(category => category.id !== catId);
    setMenu(prev => ({ ...prev, categories: remainingCategories }));
    // Immediately save the changes to the database
    handleSaveMenu();
  };


  // 3. Save to Firestore
  const handleSaveMenu = async () => {
    if (!menu) return;
    setIsSaving(true);
    setSaveStatus('');

    try {
      // Clean up the data before saving (e.g., remove products/sizes with zero/empty price)
      const cleanedMenu = JSON.parse(JSON.stringify(menu));

      cleanedMenu.categories.forEach(category => {
          category.products.forEach(product => {
              for (const size in product.prices) {
                  const price = product.prices[size];
                  // If the price is 0 or less, remove the size option
                  if (typeof price === 'number' && (isNaN(price) || price <= 0)) {
                      delete product.prices[size];
                  }
              }
          });
          // Remove products with no prices (no longer functional)
          category.products = category.products.filter(product => Object.keys(product.prices).length > 0);
      });
      
      await setDoc(doc(db, 'config', 'menu'), cleanedMenu);
      setSaveStatus('✅ Menu saved successfully! Live menu updated.');
    } catch (error) {
      console.error('Error saving menu:', error);
      setSaveStatus(`❌ Failed to save menu: ${error.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  // 4. Implement adding new category
  const handleAddNewCategory = () => {
    const trimmedName = newCatName.trim();
    if (!trimmedName || menu.categories.find(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
        alert('Invalid or duplicate category name.');
        return;
    }
    const newCatId = trimmedName.toLowerCase().replace(/\s/g, '-');
    const newCategory = { id: newCatId, name: trimmedName, products: [] };
    setMenu(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
    setNewCatName('');
  };

  // 5. Implement adding new product/flavor
  const handleAddNewProduct = () => {
      const trimmedName = newProdName.trim();
      const category = menu.categories.find(c => c.id === newProdCatId);
      
      if (!category || !trimmedName) {
          alert('Please select a category and enter a product name.');
          return;
      }
      if (category.products.find(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
          alert('Product name already exists in this category.');
          return;
      }
      
      const priceM = Number(newProdPriceM);
      const priceL = Number(newProdPriceL);

      if ((priceM <= 0 || isNaN(priceM)) && (priceL <= 0 || isNaN(priceL))) {
          alert('At least one price (Medium or Large) must be greater than zero.');
          return;
      }

      // Generate a simple unique ID for the product
      const newProdId = `${newProdCatId}-${trimmedName.toLowerCase().replace(/\s/g, '-')}`;
      const newProduct = {
          id: newProdId,
          name: trimmedName,
          prices: {}
      };

      if (priceM > 0) newProduct.prices.medium = priceM;
      if (priceL > 0) newProduct.prices.large = priceL;

      const updatedCategories = menu.categories.map(c => {
          if (c.id === newProdCatId) {
              return { ...c, products: [...c.products, newProduct] };
          }
          return c;
      });

      setMenu(prev => ({ ...prev, categories: updatedCategories }));
      
      // Clear form
      setNewProdName('');
      setNewProdPriceM('');
      setNewProdPriceL('');
      setNewProdCatId(''); 
  };

  // 6. Render Loading/Error/Data
  if (loading || !menu) {
    return (
      <div>
        <div className="page-header"><FiEdit /><h2>Menu Management</h2></div>
        <div className="page-header-underline"></div>
        <p className="no-data">Loading menu data...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><FiEdit /><h2>Menu Management (Live)</h2></div>
      <div className="page-header-underline"></div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Prices & Add-ons</h3>
          <button 
              onClick={handleSaveMenu} 
              disabled={isSaving} 
              className="auth-button"
              style={{ backgroundColor: 'var(--gold-accent)', color: 'var(--background-dark)' }}
              title="Saves all changes below to Firestore"
          >
              <FiSave /> {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
      </div>

      {saveStatus && (
        <div className={saveStatus.startsWith('❌') ? 'error-message' : 'success-message'} style={{ padding: '10px', marginBottom: '15px' }}>
            {saveStatus}
        </div>
      )}

      {/* --- ADD NEW CATEGORY & PRODUCT SECTION --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
        
        {/* Add New Category */}
        <div className="add-new-form" style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--background-light)' }}>
            <h3>New Series/Category</h3>
            <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px' }}>Category Name (e.g., "Seasonal Smoothies")</label>
                <input 
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Enter new category name"
                    className="auth-form input"
                    style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }}
                />
            </div>
            <button 
                onClick={handleAddNewCategory} 
                className="auth-button" 
                style={{ backgroundColor: 'var(--gold-accent)', color: 'var(--background-dark)', marginTop: '15px' }}
                disabled={!newCatName.trim()}
            >
                + Add Category
            </button>
        </div>

        {/* Add New Product/Flavor */}
        <div className="add-new-form" style={{ padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--background-light)' }}>
            <h3>New Product/Flavor</h3>
            <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px' }}>Select Category</label>
                <select 
                    value={newProdCatId} 
                    onChange={(e) => setNewProdCatId(e.target.value)}
                    className="auth-form input"
                    style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }}
                >
                    <option value="" disabled>Select a series...</option>
                    {menu.categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px' }}>Product Name (e.g., "Ube Mango Swirl")</label>
                <input 
                    type="text"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="Product name"
                    className="auth-form input"
                    style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }}
                />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Medium Price (₱)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={newProdPriceM}
                        onChange={(e) => setNewProdPriceM(e.target.value)}
                        placeholder="e.g., 58.00"
                        className="auth-form input"
                        style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }}
                    />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Large Price (₱)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={newProdPriceL}
                        onChange={(e) => setNewProdPriceL(e.target.value)}
                        placeholder="e.g., 68.00"
                        className="auth-form input"
                        style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }}
                    />
                </div>
            </div>

            <button 
                onClick={handleAddNewProduct} 
                className="auth-button"
                style={{ backgroundColor: '#0052cc', color: 'var(--text-primary)', marginTop: '15px' }}
                disabled={!newProdCatId || !newProdName.trim() || (newProdPriceM <= 0 && newProdPriceL <= 0)}
            >
                + Add Product
            </button>
        </div>
      </div>
      
      {/* --- ADD-ONS PRICE MANAGEMENT --- */}
      <div className="table-box" style={{ marginBottom: '30px' }}>
        <h3>Add-ons Price List</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Price (₱)</th>
              <th>Actions</th> {/* ✅ Added Actions Column */}
            </tr>
          </thead>
          <tbody>
            {menu.addons.map((addon) => (
              <tr key={addon.id}>
                <td>{addon.name}</td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    value={addon.price}
                    onChange={(e) => handleAddonPriceChange(addon.id, e.target.value)}
                    onBlur={handleSaveMenu} 
                    className="input-field"
                    style={{ width: '80px', textAlign: 'center', padding: '8px' }}
                  />
                </td>
                <td>
                  {/* For now, we are not deleting base add-ons, but the structure is here if needed */}
                  <span style={{ color: 'var(--text-secondary)' }}>N/A</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- PRODUCTS PRICE MANAGEMENT --- */}
      {(menu.categories || []).map(category => ( 
        <div className="table-box" key={category.id} style={{ marginBottom: '30px' }}>
          
          {/* Category Header with Delete Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
            <h3>Category: {category.name}</h3>
            <button 
              onClick={() => handleDeleteCategory(category.id, category.name)}
              className="auth-button"
              style={{ backgroundColor: '#D32F2F', color: 'white', padding: '8px 12px', fontSize: '0.9rem' }}
              title={`Delete the entire ${category.name} category`}
            >
              <FiTrash2 /> Delete Category
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Medium Price (₱)</th>
                <th>Large Price (₱)</th>
                <th>Actions</th> {/* ✅ Added Actions Column */}
              </tr>
            </thead>
            <tbody>
              {(category.products || []).length > 0 ? ( 
                (category.products || []).map(product => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>
                      {product.prices.medium !== undefined || product.prices.large === undefined ? (
                        <input
                          type="number"
                          step="0.01"
                          value={product.prices.medium === undefined ? '' : product.prices.medium}
                          onChange={(e) => handleProductPriceChange(category.id, product.id, 'medium', e.target.value)}
                          onBlur={handleSaveMenu}
                          placeholder="N/A"
                          className="input-field"
                          style={{ width: '80px', textAlign: 'center', padding: '8px' }}
                        />
                      ) : 'N/A'}
                    </td>
                    <td>
                      {product.prices.large !== undefined || product.prices.medium === undefined ? (
                        <input
                          type="number"
                          step="0.01"
                          value={product.prices.large === undefined ? '' : product.prices.large}
                          onChange={(e) => handleProductPriceChange(category.id, product.id, 'large', e.target.value)}
                          onBlur={handleSaveMenu}
                          placeholder="N/A"
                          className="input-field"
                          style={{ width: '80px', textAlign: 'center', padding: '8px' }}
                        />
                      ) : 'N/A'}
                    </td>
                    <td>
                      {/* ✅ Added Delete Product Button */}
                      <button
                        onClick={() => handleDeleteProduct(category.id, product.id)}
                        className="auth-button"
                        style={{ backgroundColor: '#D32F2F', color: 'white', padding: '5px 10px', fontSize: '0.8rem' }}
                        title={`Delete ${product.name}`}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">No products defined.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
      
    </div>
  );
}