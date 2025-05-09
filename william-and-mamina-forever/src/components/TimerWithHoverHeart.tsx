// src/components/TimerWithHoverHeart.tsx
import React, { type ReactNode } from 'react';

export default function TimerWithHoverHeart({ children }: { children: ReactNode }) {
  return (
    <div className="relative group inline-block">
      {children}
      <span
        className="absolute -top-4 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-float-hearts"
        style={{ animationDuration: '1.5s' }}
      >
        ❤️
      </span>
    </div>
  )
}
