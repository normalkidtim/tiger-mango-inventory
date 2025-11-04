// web-client/src/pages/CreateUser.jsx

import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { FiUserPlus, FiAlertCircle } from 'react-icons/fi';

const ROLES = ['employee', 'manager', 'admin'];

export default function CreateUser() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState(''); // NEW: Contact Number field
  const [requestedRole, setRequestedRole] = useState('employee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const { currentUser, signupAdmin } = useAuth(); // Assuming a new signupAdmin function is added
  const isAdminCreating = currentUser?.role === 'admin';

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password should be at least 6 characters');
    }
    
    if (!isAdminCreating) {
        // This should not happen if accessed through the sidebar, but kept for safety.
        return setError('Access denied. Only Administrators can create new accounts.');
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      // We'll call a new function to handle admin-side user creation
      await signupAdmin(email, password, firstName, lastName, contactNumber, requestedRole);

      setSuccess(`✅ ${getDisplayName(requestedRole)} account created successfully for ${email}!`);
      
      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFirstName('');
      setLastName('');
      setContactNumber('');
      setRequestedRole('employee'); // Reset to default role
      
    } catch (error) {
      console.error('User creation error:', error);
      setError(error.message);
    }
    
    setLoading(false);
  }
  
  // Helper to capitalize role display
  const getDisplayName = (key) => key.charAt(0).toUpperCase() + key.slice(1);


  if (!isAdminCreating) {
      return (
          <div className="page-content-wrapper">
              <div className="page-header"><FiUserPlus /><h2>Create New User</h2></div>
              <div className="page-header-underline"></div>
              <div className="error-message" style={{ marginTop: '30px', textAlign: 'center' }}>
                <FiAlertCircle size={24} style={{ marginBottom: '10px' }}/>
                <p>Access Denied. You must have Administrator privileges to view this page.</p>
              </div>
          </div>
      );
  }


  return (
    <div className="admin-creation-page">
        <div className="page-header"><FiUserPlus /><h2>Create New User Account</h2></div>
        <div className="page-header-underline"></div>

        <div className="auth-container" style={{ display: 'block', height: 'auto', padding: '0', backgroundColor: 'transparent' }}>
            <div className="auth-card" style={{ width: '100%', maxWidth: '600px', margin: 'auto', padding: '20px' }}>
                
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                
                <form onSubmit={handleSubmit} className="auth-form">
                    {/* First Name / Last Name Row */}
                    <div className="form-row-2-col"> 
                        <div className="form-group half">
                            <label>First Name *</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className="input-field"
                            />
                        </div>
                        
                        <div className="form-group half">
                            <label>Last Name *</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                className="input-field"
                            />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>Contact Number</label>
                        <input
                            type="text"
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            className="input-field"
                            placeholder='Optional'
                        />
                    </div>

                    <div className="form-group">
                        <label>Email *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="input-field"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Role *</label>
                        <select 
                            value={requestedRole} 
                            onChange={(e) => setRequestedRole(e.target.value)}
                            className="input-field"
                        >
                            {ROLES.map(role => (
                                <option key={role} value={role}>{getDisplayName(role)}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Password / Confirm Password Row */}
                    <div className="form-row-2-col"> 
                        <div className="form-group half">
                            <label>Password * (min 6 chars)</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength="6"
                                className="input-field"
                            />
                        </div>
                        
                        <div className="form-group half">
                            <label>Confirm Password *</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="input-field"
                            />
                        </div>
                    </div>
                    
                    <button 
                        disabled={loading} 
                        type="submit" 
                        className="auth-button"
                    >
                        {loading ? 'Creating Account...' : 'Create User'}
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
}