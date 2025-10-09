import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './AuthContext';

import './assets/styles/global.css';
import './assets/styles/sidebar.css';
import './assets/styles/inventory.css';
import './assets/styles/tables.css';
import './assets/styles/auth.css';
import './assets/styles/filters.css'; // ✅ ADD THIS LINE - This was the missing step

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);