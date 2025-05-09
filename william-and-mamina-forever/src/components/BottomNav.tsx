// src/components/BottomNav.tsx
import { NavLink } from 'react-router-dom';
import {
  Heart,
  MessageSquare,
  Camera,
  MapPin,
  Settings,
} from 'lucide-react';

const items = [
  { to: '/', icon: Heart, label: 'Home' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/gallery', icon: Camera, label: 'Gallery' },
  { to: '/map', icon: MapPin, label: 'Map' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  return (
    <nav className="flex justify-around p-2 bg-white shadow-inner">
      {items.map(({ to, icon: Icon }, i) => (
        <NavLink
          key={i}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center text-gray-500 p-2 space-y-1 ${
              isActive ? 'text-pink-600' : ''
            }`
          }
        >
          <Icon className="w-6 h-6" />
          <span className="text-xs">{items[i].label}</span>
          { /* Active indicator */ }
          <div
            className={`h-1 w-1 rounded-full bg-pink-600 mt-1 ${
              location.pathname === to ? 'block' : 'hidden'
            }`} 
          />
        </NavLink>
      ))}
    </nav>
  );
}
