// src/main.tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider } from './contexts/AuthContext'


createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Analytics />
    </AuthProvider>
  </React.StrictMode>
)
