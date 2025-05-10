// src/components/ProtectedRoute.tsx
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  // while we’re waiting for Firebase → just render nothing (or a spinner)
  if (loading) return null

  // once loading is false, if no user → kick to /login
  if (!user) return <Navigate to="/login" replace />

  // otherwise we have a user, render the children
  return <>{children}</>
}
