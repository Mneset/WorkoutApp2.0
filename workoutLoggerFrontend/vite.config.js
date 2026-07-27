import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Keep the REACT_APP_ env prefix so existing .env / Docker / compose config
// keeps working unchanged; only client code reads them via import.meta.env.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: {
    port: 3001,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
});
