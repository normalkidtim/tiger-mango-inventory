// web-client/src/pages/AdminPanel.jsx

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { FiUsers, FiEdit, FiSave, FiAlertCircle, FiUser, FiMail, FiPhone, FiTrash2, FiKey } from 'react-icons/fi';
import '../assets/styles/tables.css'; 
import '../assets/styles/FormManager.css'; 
import '../assets/styles/admin.css'; 

const getDisplayName = (key) => key.charAt(0).toUpperCase() + key.slice(1);
const ROLES = ['employee', 'manager', 'admin'];

// Component for a single User Card with Edit functionality
function UserCard({ user, currentUser, onSave, onStartEdit, onCancelEdit, onChange, onDelete, isEditing, onPasswordChange }) {
    const isCurrentUser = user.uid === currentUser.uid;
    const { id, email } = user;
    
    // Additional state for password change in edit mode
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const cardClass = `user-card active`; 

    const handlePasswordUpdate = () => {
        if (!newPassword || newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match.');
            return;
        }
        setPasswordError('');
        onPasswordChange(user, newPassword);
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleCancel = (userId) => {
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        onCancelEdit(userId);
    }

    return (
        <div key={id} className={cardClass}>
            <div className="user-info">
                {isEditing ? (
                    <>
                        {/* Editable Profile Details */}
                        <div className="form-group-item">
                            <label><FiUser size={14} /> First Name</label>
                            <input
                                type="text"
                                className="input-field"
                                value={user.firstName}
                                onChange={(e) => onChange(id, 'firstName', e.target.value)}
                            />
                        </div>
                        <div className="form-group-item">
                            <label><FiUser size={14} /> Last Name</label>
                            <input
                                type="text"
                                className="input-field"
                                value={user.lastName}
                                onChange={(e) => onChange(id, 'lastName', e.target.value)}
                            />
                        </div>
                        <div className="form-group-item">
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
                        <div className="form-group-item">
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
                        </div>
                        
                        {/* NEW: Change Password Section */}
                        <div className="password-change-section">
                            <h4><FiKey size={14} /> Change Password</h4>
                            {passwordError && <div className="error-message-small">{passwordError}</div>}
                            <div className="form-group-item">
                                <label>New Password (min 6 chars)</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div className="form-group-item">
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={handlePasswordUpdate}
                                className="btn-add-action btn-password"
                                disabled={!newPassword.trim() || !confirmPassword.trim()}
                            >
                                Update Password
                            </button>
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
                            className="btn-add-action btn-save"
                            disabled={isCurrentUser && user.role !== 'admin' && user.role !== user.__originalRole}
                        >
                            <FiSave /> Save Profile
                        </button>
                        <button 
                            onClick={() => handleCancel(user.id)}
                            className="btn-add-action btn-cancel"
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <div className="read-only-actions">
                        <button 
                            onClick={() => onStartEdit(user)}
                            className="btn-action-half btn-edit"
                        >
                            <FiEdit /> Edit
                        </button>
                        <button 
                            onClick={() => onDelete(user)}
                            className="btn-action-half btn-delete"
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
  
  const { currentUser } = useAuth(); 
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
      // Revert the draft state for the canceled user (optional, but clean)
      const originalUser = users.find(u => u.id === userId);
      setUsersDraft(originalUser); 
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
    
    if (draftUser.uid === currentUser.uid && draftUser.role !== 'admin') {
      setSaveStatus('❌ You cannot downgrade your own administrative rights.');
      setEditingId(null);
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
    } catch (error) {
        console.error("Error updating user:", error);
        setSaveStatus(`❌ Failed to update profile for ${draftUser.email}: ${error.message}`);
    } finally {
        setTimeout(() => setSaveStatus(''), 5000);
    }
  };
  
  // 4. Password Change Stub (Client-side)
  const handlePasswordChange = (user, newPassword) => {
      // NOTE: This function only provides the UI for the password change request.
      // Changing another user's password securely requires the Firebase Admin SDK,
      // typically implemented in a secure Cloud Function or backend server.
      
      setSaveStatus(
          `⚠️ Password for ${user.email} saved as: "${newPassword}". \n\nTHIS REQUIRES A BACKEND/CLOUD FUNCTION TO ACTUALLY BE APPLIED IN FIREBASE AUTH.`
      );
      setTimeout(() => setSaveStatus(''), 10000);
  }

  // 5. Delete Function
  const handleDeleteUser = async (user) => {
    if (user.uid === currentUser.uid) {
        setSaveStatus('❌ You cannot delete your own account.');
        setTimeout(() => setSaveStatus(''), 5000);
        return;
    }

    if (!window.confirm(`WARNING: Are you absolutely sure you want to delete the profile and access for ${user.email}? \n\nNote: The login account in Firebase Auth MUST be manually deleted later by an administrator to fully block login.`)) {
        return;
    }

    try {
        // Delete the user's profile document. AuthContext will block their login.
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
      // ... (Access Denied Block - No change)
      return (
          <div className="page-content-wrapper">
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
    // ... (Loading Block - No change)
    return (
      <div>
        <div className="page-header"><FiUsers /><h2>Admin Panel - User Accounts</h2></div>
        <div className="page-header-underline"></div>
        <p className="no-data">Loading user accounts...</p>
      </div>
    );
  }

  return (
    <div className="admin-panel-page">
      <div className="page-header"><FiUsers /><h2>Admin Panel - User Accounts ({users.length})</h2></div>
      <div className="page-header-underline"></div>
      
      {saveStatus && (
        <div className={saveStatus.startsWith('❌') ? 'error-message' : 'success-message'} style={{ padding: '10px', marginBottom: '25px' }}>
            {/* Added logic to correctly show the warning for password change */}
            {saveStatus.startsWith('⚠️') ? 
                <div style={{color: 'orange', backgroundColor: 'rgba(255, 165, 0, 0.1)', padding: '10px', borderRadius: '4px', textAlign: 'center', maxWidth: '400px'}}>{saveStatus}</div>
                : saveStatus
            }
        </div>
      )}

      {/* --- User List (Single Grid) --- */}
      <div className="admin-section">
        <div className="user-grid">
          {users.length === 0 ? (
            <p className="no-data-admin">No user accounts found.</p>
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
                        onPasswordChange={handlePasswordChange} // NEW prop
                    />
                );
            })
          )}
        </div>
      </div>
    </div>
  );
}