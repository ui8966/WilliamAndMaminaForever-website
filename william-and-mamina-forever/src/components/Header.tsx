// src/components/Header.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
//import { ArrowLeft, Menu, User } from 'lucide-react';

const titles: Record<string, string> = {
  '/': 'Home',
  '/notes': 'Notes',
  '/gallery': 'Gallery',
  '/map': 'Map',
  '/calendar': 'Calendar',
};

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === '/';

  return (
 <header
   className="
     fixed top-0 inset-x-0 z-50
     pt-[env(safe-area-inset-top)]
     bg-white bg-opacity-90 backdrop-blur-md
     flex items-center justify-between
     px-6 h-28                  
     shadow-md
   "
 >
         <button
        onClick={() => (isHome ? null : navigate(-1))}
        className="p-5"
      >
        {/*{isHome ? <Menu /> : <ArrowLeft />}*/}
        {isHome ? null : <ArrowLeft />}

      </button>
      <h1 className="text-7xl font-heading">{titles[pathname] || ''}</h1>
      <User className="w-14 h-14 text-pink-600 cursor-pointer" />
    </header>
  );
}