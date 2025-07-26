// src/components/BottomNav.tsx
import { NavLink } from 'react-router-dom';
import {
  Heart,
  Notebook,
  Camera,
  MapPin,
  Calendar,
} from 'lucide-react';

const items = [
  { to: '/', icon: Heart, label: 'Home' },
  { to: '/notes', icon: Notebook, label: 'Notes' },
  { to: '/gallery', icon: Camera, label: 'Gallery' },
  { to: '/map', icon: MapPin, label: 'Map' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
];

export default function BottomNav() {
  return (
<nav
   className="
     fixed bottom-0 inset-x-0 z-50
     pb-[env(safe-area-inset-bottom)]
     bg-white bg-opacity-90 backdrop-blur-md
     flex justify-around items-center
     h-28
     shadow-inner
   "
 >        
    {items.map(({ to, icon: Icon }, i) => (
        <NavLink
          key={i}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center text-gray-500 p-6 space-y-2 ${isActive ? 'text-blue-600' : ''}`
     }        >
          <Icon className="w-16 h-16" />
          <span className="text-lg">{items[i].label}</span>
          { /* Active indicator */ }
          <div
            className={`h-1 w-1 rounded-full bg-blue-600 mt-1 ${
              location.pathname === to ? 'block' : 'hidden'
            }`} 
          />
        </NavLink>
      ))}
    </nav>
  );
}
