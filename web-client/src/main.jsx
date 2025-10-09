import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// ✅ STEP 1: Import HashRouter instead of BrowserRouter
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContext.jsx';

import './assets/styles/global.css';
import './assets/styles/sidebar.css';
import './assets/styles/tables.css';
// Add any other global CSS imports you have here

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ✅ STEP 2: Use HashRouter here */}
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>,
);