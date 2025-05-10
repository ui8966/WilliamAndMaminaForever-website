// src/contexts/AuthContext.tsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import {
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'


interface AuthContextType {
  user: User | null
  loading: boolean
  signup: (email: string, pw: string) => Promise<void>
  login: (email: string, pw: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      // persist to localStorage
      await setPersistence(auth, browserLocalPersistence)
      // subscribe
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u)
        setLoading(false)    // now we know who we are
      })
      return unsubscribe
    })()
  }, [])

  const signup = (email: string, pw: string) =>
    createUserWithEmailAndPassword(auth, email, pw).then(() => {})
  const login = (email: string, pw: string) =>
    signInWithEmailAndPassword(auth, email, pw).then(() => {})
  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)