import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import '../src/global.css';
import App from './App';
import { Auth0Provider } from '@auth0/auth0-react'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={process.env.REACT_APP_ACCESS_DOMAIN}
      clientId={process.env.REACT_APP_ACCESS_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: `https://${process.env.REACT_APP_ACCESS_DOMAIN}/api/v2/`,
        scope: 'openid profile email read:current_user update:current_user_metadata'
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
