// src/components/ProtectedRoute.tsx
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface Props { children: ReactNode }

export default function ProtectedRoute({ children }: Props) {
  const { user } = useAuth()
  // if no user, send them to /login
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
