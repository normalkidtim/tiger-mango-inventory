// web-client/src/Login.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from './AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate(); 

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/'); 
    } catch (err) {
      // --- UPDATED ERROR HANDLING ---
      // Check for our custom verification error from AuthContext
      if (err.message.includes("verify your email")) {
        setError(err.message);
      } else {
        // Handle all other errors (wrong password, etc.)
        setError('Failed to log in. Please check your email and password.');
      }
      console.error(err);
      // --- END UPDATED BLOCK ---
    }
    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-card card"> 
        <h2 className="auth-title">Tealicieux</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input 
              className="input-field"
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              className="input-field"
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button 
            disabled={loading} 
            type="submit" 
            className="btn btn-primary auth-button"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}