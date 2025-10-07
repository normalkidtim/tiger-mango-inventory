// Register.jsx
import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function Register({ onToggleForm }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [requestedRole, setRequestedRole] = useState('employee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const { currentUser, signup } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password should be at least 6 characters');
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      await signup(email, password, firstName, lastName);

      // Check user context to determine message
      if (!currentUser) {
        // New registration
        const users = JSON.parse(localStorage.getItem('tigerMangoUsers') || '[]');
        if (users.length === 1) {
          setSuccess('🎉 First admin account created successfully! You are now logged in.');
        } else {
          setSuccess('✅ Registration request submitted! The admin will review your application soon.');
        }
      } else {
        // Admin creating new user
        setSuccess(`✅ ${requestedRole} account created successfully!`);
      }
      
      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFirstName('');
      setLastName('');
      setRequestedRole('employee');
      
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);
    }
    
    setLoading(false);
  }

  const isAdminCreating = currentUser && currentUser.role === 'admin';

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>👤 {isAdminCreating ? 'Create New User' : 'Request Account Access'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group half">
              <label>First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group half">
              <label>Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          {isAdminCreating && (
            <div className="form-group">
              <label>Role</label>
              <select value={requestedRole} onChange={(e) => setRequestedRole(e.target.value)}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          
          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>
          
          <div className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            disabled={loading} 
            type="submit" 
            className="auth-button"
          >
            {loading ? 'Creating Account...' : isAdminCreating ? 'Create User' : 'Submit for Approval'}
          </button>
        </form>
        
        {!isAdminCreating && (
          <div className="approval-notice">
            <h4>📋 Approval Process:</h4>
            <ol>
              <li>Submit this request form</li>
              <li>Admin will review your information</li>
              <li>You'll be notified when approved</li>
              <li>Login with your credentials</li>
            </ol>
          </div>
        )}
        
        <p className="toggle-auth">
          <button className="link-button" onClick={onToggleForm}>
            ← Back to {isAdminCreating ? 'Dashboard' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}