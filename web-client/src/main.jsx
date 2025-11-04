import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './AuthContext';

// Import NEW Redesigned Stylesheets
import './assets/styles/global.css';
import './assets/styles/sidebar.css';
import './assets/styles/auth.css';
import './assets/styles/filters.css'; 
import './assets/styles/tables.css';
import './assets/styles/FormManager.css'; 
import './assets/styles/PurchaseHistory.css';
import './assets/styles/analytics.css'; 
import './assets/styles/inventory.css';
import './assets/styles/admin.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);