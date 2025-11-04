// web-client/src/pages/AdminPanel.jsx

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { FiUsers, FiEdit, FiSave, FiAlertCircle, FiUser, FiMail, FiPhone, FiTrash2, FiKey } from 'react-icons/fi';
// Import required styles
import '../assets/styles/tables.css'; 
import '../assets/styles/FormManager.css'; 
import '../assets/styles/admin.css'; 

const getDisplayName = (key) => key.charAt(0).toUpperCase() + key.slice(1);
const ROLES = ['employee', 'manager', 'admin'];

// --- Self-Service Password Component ---
function SelfPasswordChangeForm({ onChangePassword, onClose }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);
      await onChangePassword(newPassword);
      setSuccess('✅ Your password has been updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(onClose, 2000); // Close after 2s on success
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        setError('❌ This is a sensitive operation. Please log out and log back in to change your password.');
      } else {
        setError(`❌ Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div className="card-header">
        <h3><FiKey /> Change Your Password</h3>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="card-body">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="form-row-2-col">
            <div className="form-group">
              <label>New Password (min 6 chars)</label>
              <input
                type="password"
                className="input-field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
        <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}


// --- User Card Component ---
function UserCard({ user, currentUser, onSave, onStartEdit, onCancelEdit, onChange, onDelete, isEditing }) {
    const isCurrentUser = user.uid === currentUser.uid;
    const { id, email } = user;
    
    const cardClass = `user-card active`; 

    const handleCancel = (userId) => {
        onCancelEdit(userId);
    }

    return (
        <div key={id} className={`card ${cardClass}`}>
            <div className="card-body user-info">
                {isEditing ? (
                    <>
                        {/* Editable Profile Details */}
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label><FiUser size={14} /> First Name</label>
                            <input
                                type="text"
                                className="input-field"
                                value={user.firstName}
                                onChange={(e) => onChange(id, 'firstName', e.target.value)}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label><FiUser size={14} /> Last Name</label>
                            <input
                                type="text"
                                className="input-field"
                                value={user.lastName}
                                onChange={(e) => onChange(id, 'lastName', e.target.value)}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label><FiPhone size={14} /> Contact Number</label>
                            <input
                                type="text"
                                className="input-field"
                                value={user.contactNumber || ''} 
                                onChange={(e) => onChange(id, 'contactNumber', e.target.value)}
                                placeholder="e.g., 0917xxxxxxx"
                            />
                        </div>

                        <p className="user-email"><FiMail size={14} /> {email}</p>
                        
                        {/* Editable Role */}
                        <div className="form-group" style={{ marginBottom: '0' }}>
                            <label>Role</label>
                            <select 
                                className="input-field"
                                value={user.role} 
                                onChange={(e) => onChange(id, 'role', e.target.value)}
                                disabled={isCurrentUser && user.role !== 'admin'}
                            >
                                {ROLES.map(role => (
                                    <option key={role} value={role}>
                                        {getDisplayName(role)}
                                    </option>
                                ))}
                            </select>
                            {isCurrentUser && user.role !== 'admin' && (
                                <small style={{ color: 'var(--c-text-secondary)', marginTop: '5px' }}>You cannot change your own role.</small>
                            )}
                        </div>
                    </>
                ) : (
                    // Read-only display mode
                    <>
                        <h4>{user.firstName} {user.lastName}</h4>
                        <p className="user-email"><FiMail size={14} /> {email}</p>
                        <p className="user-contact"><FiPhone size={14} /> {user.contactNumber || 'N/A'}</p> 
                        <p className="user-role">Role: <span className={`role-badge ${user.role}`}>{getDisplayName(user.role)}</span></p>
                    </>
                )}
            </div>

            <div className="user-card-actions">
                {isEditing ? (
                    <>
                        <button 
                            onClick={() => onSave(user)}
                            className="btn btn-success" 
                            disabled={isCurrentUser && user.role !== 'admin' && user.role !== user.__originalRole}
                        >
                            <FiSave /> Save Profile
                        </button>
                        <button 
                            onClick={() => handleCancel(user.id)}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <div className="read-only-actions">
                        <button 
                            onClick={() => onStartEdit(user)}
                            className="btn btn-secondary"
                        >
                            <FiEdit /> Edit
                        </button>
                        <button 
                            onClick={() => onDelete(user)}
                            className="btn btn-danger"
                            disabled={isCurrentUser}
                        >
                            <FiTrash2 /> Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}


export default function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [usersDraft, setUsersDraft] = useState({}); 
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState('');
    const [showSelfPassword, setShowSelfPassword] = useState(false); 
    
    const { currentUser, changeSelfPassword } = useAuth(); 
    const isAdmin = currentUser?.role === 'admin';

    // 1. Fetch data
    useEffect(() => {
        if (!isAdmin) return;

        const q = collection(db, 'users');
        
        const unsub = onSnapshot(q, (snap) => {
        const usersList = [];
        snap.forEach((docSnap) => {
            const userData = { id: docSnap.id, ...docSnap.data() };
            usersList.push({ 
                ...userData,
                __originalRole: userData.role 
            }); 
        });
        setUsers(usersList.sort((a, b) => a.lastName.localeCompare(b.lastName)));
        setLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            setSaveStatus('❌ Failed to load user accounts.');
            setLoading(false);
        });

        return () => unsub();
    }, [isAdmin]);
    
    // 2. Handlers for Edit Mode and State Management
    const handleStartEdit = (user) => {
        setUsersDraft(user); 
        setEditingId(user.id);
        setSaveStatus('');
    };
    
    const handleCancelEdit = (userId) => {
        setUsersDraft({}); 
        setEditingId(null);
    };
    
    const handleUserChange = (id, field, value) => {
        setUsersDraft(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 3. Core Save Profile Function
    const handleSaveUser = async (draftUser) => {
        if (!draftUser.firstName || !draftUser.lastName || !draftUser.role) {
            setSaveStatus('❌ First name, last name, and role are required.');
            setTimeout(() => setSaveStatus(''), 5000);
            return;
        }
        
        const originalUser = users.find(u => u.id === draftUser.id);
        
        if (draftUser.uid === currentUser.uid && draftUser.role !== 'admin' && originalUser.role === 'admin') {
            setSaveStatus('❌ You cannot downgrade your own administrative rights.');
            setEditingId(null);
            setUsersDraft({}); 
            setTimeout(() => setSaveStatus(''), 5000);
            return;
        }
        
        const changes = {
            firstName: draftUser.firstName,
            lastName: draftUser.lastName,
            role: draftUser.role,
            contactNumber: draftUser.contactNumber || '', 
        };

        try {
            setEditingId(null); 
            await updateDoc(doc(db, 'users', draftUser.id), changes);

            setSaveStatus(`✅ Profile for ${draftUser.email} updated successfully.`);
            setUsersDraft({}); 
        } catch (error) {
            console.error("Error updating user:", error);
            setSaveStatus(`❌ Failed to update profile for ${draftUser.email}: ${error.message}`);
        } finally {
            setTimeout(() => setSaveStatus(''), 5000);
        }
    };
    
    // 4. Delete Function
    const handleDeleteUser = async (user) => {
        if (user.uid === currentUser.uid) {
            setSaveStatus('❌ You cannot delete your own account.');
            setTimeout(() => setSaveStatus(''), 5000);
            return;
        }

        if (!window.confirm(`WARNING: Are you absolutely sure you want to delete the user profile for ${user.email}? \n\nThis will immediately block them from using the mobile and web apps. This action cannot be undone.`)) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'users', user.id)); 
            setSaveStatus(`🗑️ Profile deleted for ${user.email}. User can no longer access the app.`);
        } catch (error) {
            console.error("Error deleting user:", error);
            setSaveStatus(`❌ Failed to delete account profile for ${user.email}: ${error.message}`);
        } finally {
            setTimeout(() => setSaveStatus(''), 5000);
        }
    };


    if (!isAdmin) {
        return (
            <div className="admin-panel-page page-container"> {/* UPDATED WRAPPER */}
                <div className="page-header"><FiUsers /><h2>Admin Panel - User Management</h2></div>
                <div className="page-header-underline"></div>
                <div className="error-message" style={{ marginTop: '30px', textAlign: 'center' }}>
                    <FiAlertCircle size={24} style={{ marginBottom: '10px' }}/>
                    <p>Access Denied. You must have Administrator privileges to view this page.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
        <div className="admin-panel-page page-container"> {/* UPDATED WRAPPER */}
            <div className="page-header"><FiUsers /><h2>Admin Panel - User Accounts</h2></div>
            <div className="page-header-underline"></div>
            <p className="no-data">Loading user accounts...</p>
        </div>
        );
    }

    return (
        <div className="admin-panel-page page-container"> {/* UPDATED WRAPPER */}
        <div className="page-header"><FiUsers /><h2>Admin Panel - User Accounts ({users.length})</h2></div>
        <div className="page-header-underline"></div>
        
        {saveStatus && (
            <div className={saveStatus.startsWith('❌') ? 'error-message' : 'success-message'}>
                {saveStatus}
            </div>
        )}
        
        {!showSelfPassword && (
          <button 
              onClick={() => setShowSelfPassword(true)}
              className="btn btn-secondary" 
              style={{ marginBottom: '20px', maxWidth: '250px' }}
          >
              <FiKey /> Change My Password
          </button>
        )}
        
        {showSelfPassword && (
            <SelfPasswordChangeForm
                onChangePassword={changeSelfPassword}
                onClose={() => setShowSelfPassword(false)}
            />
        )}


        {/* --- User List (Single Grid) --- */}
        <div className="admin-section">
            <div className="user-grid">
            {users.length === 0 ? (
                <div className="card"><p className="no-data">No user accounts found.</p></div>
            ) : (
                users.map(user => {
                    const userToRender = editingId === user.id ? usersDraft : user;
                    return (
                        <UserCard
                            key={user.id}
                            user={userToRender}
                            currentUser={currentUser}
                            isEditing={editingId === user.id}
                            onSave={handleSaveUser}
                            onStartEdit={handleStartEdit}
                            onCancelEdit={handleCancelEdit}
                            onChange={handleUserChange}
                            onDelete={handleDeleteUser}
                        />
                    );
                })
            )}
            </div>
        </div>
        </div>
    );
}