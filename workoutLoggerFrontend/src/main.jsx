import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import App from './App';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Auth0Provider
      domain={import.meta.env.REACT_APP_ACCESS_DOMAIN}
      clientId={import.meta.env.REACT_APP_ACCESS_CLIENT_ID}
      useRefreshTokens={true}
      cacheLocation="localstorage"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.REACT_APP_API_AUDIENCE,
        scope: 'openid profile email start:session',
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
