// src/contexts/AuthContext.tsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth'
import { auth } from '../lib/firebase'

interface AuthContextType {
  user: null | import('firebase/auth').User
  signup: (email: string, pw: string) => Promise<void>
  login:  (email: string, pw: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null)

  useEffect(() => 
    onAuthStateChanged(auth, u => setUser(u)), 
  [])

  const signup = (email: string, pw: string) => 
    createUserWithEmailAndPassword(auth, email, pw).then(() => {})

  const login  = (email: string, pw: string) => 
    signInWithEmailAndPassword(auth, email, pw).then(() => {})

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
