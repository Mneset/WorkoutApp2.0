import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import '../src/global.css';
import App from './App';
import { Auth0Provider } from '@auth0/auth0-react'
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={process.env.REACT_APP_ACCESS_DOMAIN}
      clientId={process.env.REACT_APP_ACCESS_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: process.env.REACT_APP_API_AUDIENCE,
        scope: 'openid profile email start:session'
      }}
    >
      <AuthProvider>
        <SessionProvider>
          <App />
        </SessionProvider>
      </AuthProvider>
    </Auth0Provider>
  </React.StrictMode>
);
