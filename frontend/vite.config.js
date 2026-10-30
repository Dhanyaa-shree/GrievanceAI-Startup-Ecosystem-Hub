import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND = 'http://localhost:5000';

// Every top-level backend route that needs to be proxied
const PROXIED_PATHS = [
  '/api',
  '/admin',
  '/admin-login',
  '/admin-logout',
  '/officer',
  '/officers',
  '/check-whitelist',
  '/send-otp',
  '/verify-otp',
  '/check-auth',
  '/check-admin-session',
  '/founder-logout',
  '/submit-grievance',
  '/my-grievances',
  '/all-grievances',
  '/update-status',
  '/grievance',
  '/analytics',
  '/faq',
  '/health',
  '/test',
  '/gemini-assist',
  '/debug',
];

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    proxy: Object.fromEntries(
      PROXIED_PATHS.map((path) => [
        path,
        { target: BACKEND, changeOrigin: true, secure: false },
      ])
    ),
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
});