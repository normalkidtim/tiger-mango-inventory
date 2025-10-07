// Login.jsx
import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function Login({ onToggleForm }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
    } catch (error) {
      if (error.message.includes('pending')) {
        setError('Account pending admin approval. Please wait for approval.');
      } else if (error.message.includes('Invalid')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError('Failed to log in: ' + error.message);
      }
    }
    
    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🔐 Tiger Mango Login</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          
          <button 
            disabled={loading} 
            type="submit" 
            className="auth-button"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="toggle-auth">
          Don't have an account?{' '}
          <button className="link-button" onClick={onToggleForm}>
            Register here
          </button>
        </p>

        <div style={{background: '#f0f8ff', padding: '15px', borderRadius: '8px', marginTop: '20px', fontSize: '14px'}}>
          <p><strong>First Time?</strong> The first person to register becomes the Admin!</p>
        </div>
      </div>
    </div>
  );
}