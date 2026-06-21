import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configure Vite Server to run on Port 3000
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
});
