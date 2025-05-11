// src/components/Header.tsx
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Menu as MenuIcon, User as UserIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const titles: Record<string, string> = {
  '/': 'Home',
  '/notes': 'Notes',
  '/gallery': 'Gallery',
  '/map': 'Map',
  '/calendar': 'Calendar',
}

export default function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const isHome = pathname === '/'

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout failed', err)
    }
  }

return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 pt-[env(safe-area-inset-top)]
        bg-white bg-opacity-90 backdrop-blur-md flex items-center justify-between
        px-6 h-28 shadow-md"
      >
        <button
          onClick={() => isHome ? setMenuOpen(true) : navigate(-1)}
          className="p-4"
        >
          {isHome
            ? <MenuIcon className="w-14 h-14 text-pink-600" />
            : <ArrowLeft className="w-14 h-14 text-pink-600" />
          }
        </button>

        <h1 className="text-7xl font-heading">
          {titles[pathname] || ''}
        </h1>

        <button onClick={() => navigate('/profile')} className="p-2">
          {user?.photoURL
            // show their avatar if they have one
            ? <img
                src={user.photoURL}
                alt="Your avatar"
                className="w-14 h-14 rounded-full object-cover border-2 border-pink-300"
              />
            // otherwise, generic icon
            : <UserIcon className="w-14 h-14 text-pink-600" />
          }
        </button>
      </header>

      {/* Side menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Side navigation drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <span className="text-4xl font-heading text-pink-600">Menu</span>
          <button onClick={() => setMenuOpen(false)} className="p-2">
            ✕
          </button>
        </div>

        <nav className="p-4">
          <button
            onClick={handleLogout}
            className="w-full text-left text-3xl text-red-500 hover:bg-red-50 p-3 rounded-md"
          >
            Log out
          </button>
        </nav>
      </aside>
    </>
  )
}
