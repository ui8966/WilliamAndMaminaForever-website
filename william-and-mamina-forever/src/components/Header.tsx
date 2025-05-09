// src/components/Header.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';

const titles: Record<string, string> = {
  '/': 'Home',
  '/messages': 'Messages',
  '/gallery': 'Gallery',
  '/map': 'Map',
  '/settings': 'Settings',
};

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === '/';

  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-md">
      <button
        onClick={() => (isHome ? null : navigate(-1))}
        className="p-2"
      >
        {isHome ? <Menu /> : <ArrowLeft />}
      </button>
      <h1 className="text-xl font-heading">{titles[pathname] || ''}</h1>
      <img
        src="/avatar.png"
        alt="Profile"
        onClick={() => navigate('/settings')}
        className="w-8 h-8 rounded-full cursor-pointer"
      />
    </header>
  );
}