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
  const [contactNumber, setContactNumber] = useState('');
  const [requestedRole, setRequestedRole] = useState('employee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const { currentUser, signupAdmin } = useAuth();
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
        return setError('Access denied. Only Administrators can create new accounts.');
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      await signupAdmin(email, password, firstName, lastName, contactNumber, requestedRole);

      // --- UPDATED SUCCESS MESSAGE ---
      setSuccess(`✅ Account created for ${email}. A verification email has been sent to them. They must verify their email before they can log in.`);
      
      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFirstName('');
      setLastName('');
      setContactNumber('');
      setRequestedRole('employee'); 
      
    } catch (error) {
      console.error('User creation error:', error);
      setError(error.message);
    }
    
    setLoading(false);
  }
  
  const getDisplayName = (key) => key.charAt(0).toUpperCase() + key.slice(1);


  if (!isAdminCreating) {
      return (
          <div className="admin-creation-page page-container"> 
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
    <div className="admin-creation-page page-container"> 
        <div className="page-header"><FiUserPlus /><h2>Create New User Account</h2></div>
        <div className="page-header-underline"></div>

        <div className="auth-container" style={{ display: 'block', minHeight: 'auto', padding: '0', backgroundColor: 'transparent' }}>
            <div className="auth-card card" style={{ width: '100%', maxWidth: '600px', margin: '0', padding: '24px', textAlign: 'left' }}> 
                
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-row-2-col"> 
                        <div className="form-group">
                            <label>First Name *</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className="input-field"
                            />
                        </div>
                        
                        <div className="form-group">
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
                            placeholder='Optional (e.g., 0917xxxxxxx)'
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
                    
                    <div className="form-row-2-col"> 
                        <div className="form-group">
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
                        
                        <div className="form-group">
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
                        className="btn btn-primary auth-button"
                    >
                        {loading ? 'Creating Account...' : 'Create User & Send Verification'}
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
}