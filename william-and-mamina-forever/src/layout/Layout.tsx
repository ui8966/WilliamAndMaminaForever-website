// src/layout/Layout.tsx
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import { AnimatePresence, motion } from 'framer-motion'

export default function Layout() {
  const location = useLocation()
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-grow overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  )
}
