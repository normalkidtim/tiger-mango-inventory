// web-client/src/pages/MenuManager.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { FiEdit, FiTrash2, FiPlus, FiCoffee, FiPackage, FiFilter } from 'react-icons/fi'; 

// Note: FormManager.css and tables.css are imported via main.jsx
const getDisplayName = (key) => key.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const slugify = (text) => text.toLowerCase().replace(/\s/g, '-').replace(/[^a-z0-9-]/g, '');

export default function MenuManager() {
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const [newCatName, setNewCatName] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdCatId, setNewProdCatId] = useState('');
  const [newProdPriceM, setNewProdPriceM] = useState('');
  const [newProdPriceL, setNewProdPriceL] = useState('');
  const [newProdLidType, setNewProdLidType] = useState(''); 
  const [newProdStrawType, setNewProdStrawType] = useState(''); 
  
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');

  const LID_OPTIONS = [
    { value: 'flat-lid', label: 'Flat Lid' },
    { value: 'dome-lid', label: 'Dome Lid' },
    { value: 'none', label: 'No Lid (e.g., Hot Drink)' },
  ];
  const STRAW_OPTIONS = [
    { value: 'boba-straw', label: 'Boba/Thick Straw' },
    { value: 'thin-straw', label: 'Thin/Regular Straw' },
    { value: 'none', label: 'No Straw' },
  ];

  useEffect(() => {
    const docRef = doc(db, 'config', 'menu');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMenu({ categories: data.categories || [], addons: data.addons || [] });
      } else {
        setMenu({ categories: [], addons: [] });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const commitChanges = async (dataToSave, successMessage) => {
    if (!dataToSave) return;
    
    setIsSaving(true);
    setSaveStatus(''); 

    try {
      const cleanedMenu = JSON.parse(JSON.stringify(dataToSave));
      const cleanedCategories = (cleanedMenu.categories || []).map(category => {
        category.products = (category.products || []).filter(product => {
            if (product.prices) {
                for (const size in product.prices) {
                    const price = product.prices[size];
                    if (typeof price === 'number' && (isNaN(price) || price <= 0)) {
                        delete product.prices[size];
                    }
                }
                return Object.keys(product.prices).length > 0;
            }
            return false;
        });
        return category;
      });
      cleanedMenu.categories = cleanedCategories; 
      
      await setDoc(doc(db, 'config', 'menu'), cleanedMenu);
      setSaveStatus(successMessage || '✅ Changes saved successfully!'); 

    } catch (error) {
      console.error('Error saving menu:', error);
      setSaveStatus(`❌ Failed to save menu: ${error.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  const handleAddonPriceChange = (id, newPrice) => {
    const updatedAddons = menu.addons.map(addon => 
      addon.id === id ? { ...addon, price: Number(newPrice) } : addon
    );
    setMenu(prev => ({ ...prev, addons: updatedAddons }));
  };
  
  const handlePriceUpdateSave = (successMessage) => {
      commitChanges(menu, successMessage);
  }

  const handleAddNewAddon = async () => { 
    const trimmedName = newAddonName.trim();
    const price = Number(newAddonPrice);
    const id = slugify(trimmedName);
    if (!trimmedName || isNaN(price) || price <= 0) {
        alert('Please enter a valid name and a price greater than zero.');
        return;
    }
    if (menu.addons.find(a => a.id === id)) {
        alert('An add-on with this name already exists.');
        return;
    }
    const newAddon = { id, name: trimmedName, price };
    const newMenuState = { ...menu, addons: [...(menu.addons || []), newAddon] };
    try {
        await commitChanges(newMenuState, `✅ New add-on "${trimmedName}" added and saved.`);
        await setDoc(doc(db, 'inventory', 'add-ons'), { [id]: 0 }, { merge: true });
    } catch (error) {
        setSaveStatus(`❌ Failed to add add-on inventory: ${error.message}`);
    }
    setNewAddonName('');
    setNewAddonPrice('');
  };
  
  const handleDeleteAddon = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the add-on: ${name}?`)) return;
    const updatedAddons = menu.addons.filter(addon => addon.id !== id);
    const newMenuState = { ...menu, addons: updatedAddons };
    try {
        await commitChanges(newMenuState, `🗑️ Add-on "${name}" deleted and saved.`);
        await updateDoc(doc(db, 'inventory', 'add-ons'), { [id]: deleteField() });
    } catch (error) {
        setSaveStatus(`❌ Failed to delete add-on inventory item: ${error.message}`);
    }
  };

  const handleProductPriceChange = (catId, prodId, size, newPrice) => {
    const updatedCategories = menu.categories.map(category => {
      if (category.id === catId) {
        const updatedProducts = (category.products || []).map(product => {
          if (product.id === prodId) {
            const newPrices = { ...product.prices, [size]: Number(newPrice) };
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

  const handleAddNewCategory = async () => { 
    const trimmedName = newCatName.trim();
    if (!trimmedName || (menu.categories || []).find(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
        alert('Invalid or duplicate category name.');
        return;
    }
    const newCatId = slugify(trimmedName);
    const newCategory = { id: newCatId, name: trimmedName, products: [] }; 
    const newMenuState = { ...menu, categories: [...(menu.categories || []), newCategory] };
    await commitChanges(newMenuState, `✅ New category "${trimmedName}" created and saved.`);
    setNewCatName('');
  };

  const handleAddNewProduct = async () => { 
      const trimmedName = newProdName.trim();
      const category = (menu.categories || []).find(c => c.id === newProdCatId);
      if (!category || !trimmedName) {
          alert('Please select a category and enter a product name.');
          return;
      }
      if ((category.products || []).find(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
          alert('Product name already exists in this category.');
          return;
      }
      const priceM = Number(newProdPriceM);
      const priceL = Number(newProdPriceL);
      const lidType = newProdLidType; 
      const strawType = newProdStrawType;
      if ((priceM <= 0 || isNaN(priceM)) && (priceL <= 0 || isNaN(priceL))) {
          alert('At least one price (Medium or Large) must be greater than zero.');
          return;
      }
      if (!lidType || !strawType) {
          alert('Please select a Lid Type and a Straw Type for the recipe.');
          return;
      }
      const newProdId = `${newProdCatId}-${slugify(trimmedName)}`;
      const newProduct = {
          id: newProdId,
          name: trimmedName,
          ...(lidType && { lidType }), 
          ...(strawType && { strawType }), 
          prices: {}
      };
      if (priceM > 0) newProduct.prices.medium = priceM;
      if (priceL > 0) newProduct.prices.large = priceL;
      const updatedCategories = menu.categories.map(c => {
          if (c.id === newProdCatId) {
              const existingProducts = c.products || []; 
              return { ...c, products: [...existingProducts, newProduct] };
          }
          return c;
      });
      const newMenuState = { ...menu, categories: updatedCategories };
      await commitChanges(newMenuState, `✅ New product "${trimmedName}" added and saved.`);
      setNewProdName('');
      setNewProdPriceM('');
      setNewProdPriceL('');
      setNewProdCatId(''); 
      setNewProdLidType(''); 
      setNewProdStrawType(''); 
  };

  const handleDeleteProduct = async (catId, prodId, prodName) => {
    if (!window.confirm("Are you sure you want to delete this flavor? This cannot be undone.")) return;
    const updatedCategories = menu.categories.map(category => {
        if (category.id === catId) {
            const remainingProducts = (category.products || []).filter(product => product.id !== prodId);
            return { ...category, products: remainingProducts };
        }
        return category;
    });
    const newMenuState = { ...menu, categories: updatedCategories };
    await commitChanges(newMenuState, `🗑️ Product "${prodName}" deleted and saved.`);
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Are you sure you want to delete the entire category: ${catName}? This will remove all flavors inside it.`)) return;
    const updatedCategories = menu.categories.filter(category => category.id !== catId);
    const newMenuState = { ...menu, categories: updatedCategories };
    await commitChanges(newMenuState, `🗑️ Category "${catName}" deleted and saved.`);
  };

  if (loading || !menu) {
    return (
      <div className="page-container"> {/* ADDED WRAPPER */}
        <div className="page-header"><FiEdit /><h2>Menu Management</h2></div>
        <div className="page-header-underline"></div>
        <p className="no-data">Loading menu data...</p>
      </div>
    );
  }

  return (
    <div className="page-container"> {/* ADDED WRAPPER */}
      <div className="page-header"><FiEdit /><h2>Menu Management</h2></div>
      <div className="page-header-underline"></div>

      {saveStatus && (
        <div className={saveStatus.startsWith('❌') ? 'error-message' : 'success-message'}>
            {saveStatus}
        </div>
      )}

      {/* --- ADD NEW FORMS --- */}
      <div className="form-row-2-col" style={{ alignItems: 'flex-start' }}>
        <div className="card">
            <div className="card-header"><h3><FiPackage /> New Series/Category</h3></div>
            <div className="card-body">
                <div className="form-group">
                    <label>Category Name (e.g., "Seasonal Smoothies")</label>
                    <input 
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Enter new category name"
                        className="input-field"
                    />
                </div>
                <button 
                    onClick={handleAddNewCategory} 
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={!newCatName.trim()}
                >
                    <FiPlus /> Add Category
                </button>
            </div>
        </div>

        <div className="card">
            <div className="card-header"><h3><FiCoffee /> New Product/Flavor</h3></div>
            <div className="card-body">
                <div className="form-group">
                    <label>Select Category</label>
                    <select value={newProdCatId} onChange={(e) => setNewProdCatId(e.target.value)} className="input-field">
                        <option value="" disabled>Select a series...</option>
                        {(menu.categories || []).map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Product Name (e.g., "Ube Mango Swirl")</label>
                    <input type="text" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} placeholder="Product name" className="input-field" />
                </div>
                <div className="form-group">
                    <label>Lid Type (for Inventory Deduction) *</label>
                    <select value={newProdLidType} onChange={(e) => setNewProdLidType(e.target.value)} className="input-field">
                        <option value="" disabled>Select lid type...</option>
                        {LID_OPTIONS.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Straw Type (for Inventory Deduction) *</label>
                    <select value={newProdStrawType} onChange={(e) => setNewProdStrawType(e.target.value)} className="input-field">
                        <option value="" disabled>Select straw type...</option>
                        {STRAW_OPTIONS.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
                    </select>
                </div>
                <div className="form-inline-group" style={{ marginBottom: '16px' }}>
                    <div className="form-group-item">
                        <label>Medium Price (₱)</label>
                        <input type="number" step="0.01" value={newProdPriceM} onChange={(e) => setNewProdPriceM(e.target.value)} placeholder="e.g., 58.00" className="input-field" />
                    </div>
                    <div className="form-group-item">
                        <label>Large Price (₱)</label>
                        <input type="number" step="0.01" value={newProdPriceL} onChange={(e) => setNewProdPriceL(e.target.value)} placeholder="e.g., 68.00" className="input-field" />
                    </div>
                </div>
                <button 
                    onClick={handleAddNewProduct} 
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                    disabled={!newProdCatId || !newProdName.trim() || !newProdLidType || !newProdStrawType || (newProdPriceM <= 0 && newProdPriceL <= 0)}
                >
                    <FiPlus /> Add Product
                </button>
            </div>
        </div>
      </div>
      
      {/* --- ADD-ONS MANAGEMENT --- */}
      <div className="card">
          <div className="card-header"><h3><FiFilter /> Manage Add-ons</h3></div>
          <div className="card-body">
            <div className="form-inline-group" style={{ alignItems: 'flex-end', marginBottom: '24px' }}>
                <div className="form-group-item addon-name-field">
                    <label>Add-on Name</label>
                    <input type="text" value={newAddonName} onChange={(e) => setNewAddonName(e.target.value)} placeholder="e.g., Boba Pearl" className="input-field" />
                </div>
                <div className="form-group-item addon-price-field">
                    <label>Price (₱)</label>
                    <input type="number" step="0.01" value={newAddonPrice} onChange={(e) => setNewAddonPrice(e.target.value)} placeholder="e.g., 10.00" className="input-field" />
                </div>
                <button 
                    onClick={handleAddNewAddon} 
                    className="btn btn-secondary"
                    disabled={!newAddonName.trim() || isNaN(Number(newAddonPrice)) || Number(newAddonPrice) <= 0}
                >
                    <FiPlus /> Add
                </button>
            </div>

            {/* --- ADD-ONS PRICE LIST TABLE --- */}
            <div className="card no-padding" style={{ margin: 0, boxShadow: 'none' }}>
              <div className="card-body">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Price (₱)</th>
                      <th>Actions</th> 
                    </tr>
                  </thead>
                  <tbody>
                    {(menu.addons || []).length > 0 ? (
                        (menu.addons || []).map((addon) => (
                            <tr key={addon.id}>
                                <td>{addon.name}</td>
                                <td>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={addon.price}
                                        onChange={(e) => handleAddonPriceChange(addon.id, e.target.value)}
                                        onBlur={() => handlePriceUpdateSave(`✅ Price updated for ${addon.name}.`)} 
                                        className="input-field"
                                    />
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleDeleteAddon(addon.id, addon.name)}
                                        className="btn btn-danger"
                                        style={{ height: '36px', padding: '0 10px' }}
                                        title={`Delete ${addon.name}`}
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" className="no-data">No add-ons found. Use the form above to add one.</td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
      </div>

      {/* --- PRODUCTS PRICE MANAGEMENT (Category list) --- */}
      {(menu.categories || []).map(category => ( 
        <div className="card no-padding" key={category.id}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Category: {category.name}</h3>
            <button 
              onClick={() => handleDeleteCategory(category.id, category.name)}
              className="btn btn-danger"
              style={{ height: '36px', padding: '0 12px', fontSize: '0.9rem' }}
              title={`Delete the entire ${category.name} category`}
            >
              <FiTrash2 /> 
            </button>
          </div>
          <div className="card-body">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Medium Price (₱)</th>
                  <th>Large Price (₱)</th>
                  <th>Actions</th> 
                </tr>
              </thead>
              <tbody>
                {(category.products || []).length > 0 ? (
                  (category.products || []).map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={product.prices.medium === undefined ? '' : product.prices.medium}
                          onChange={(e) => handleProductPriceChange(category.id, product.id, 'medium', e.target.value)}
                          onBlur={() => handlePriceUpdateSave(`✅ Price updated for ${product.name}.`)}
                          placeholder="N/A"
                          className="input-field"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={product.prices.large === undefined ? '' : product.prices.large}
                          onChange={(e) => handleProductPriceChange(category.id, product.id, 'large', e.target.value)}
                          onBlur={() => handlePriceUpdateSave(`✅ Price updated for ${product.name}.`)}
                          placeholder="N/A"
                          className="input-field"
                        />
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteProduct(category.id, product.id, product.name)}
                          className="btn btn-danger"
                          style={{ height: '36px', padding: '0 10px' }}
                          title={`Delete ${product.name}`}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-data">No products in this category.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}