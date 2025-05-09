// src/components/FloatingHearts.tsx
export default function FloatingHearts() {
  // positions & delays for variety
  const hearts = [
    { left: '10%', delay: '0s'  },
    { left: '30%', delay: '2s'  },
    { left: '50%', delay: '1s'  },
    { left: '70%', delay: '3s'  },
    { left: '90%', delay: '0.5s'}
  ]

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {hearts.map((h, i) => (
        <div
          key={i}
          className="absolute text-3xl animate-float-hearts"
          style={{
            left: h.left,
            bottom: '-2rem',
            animationDelay: h.delay,
          }}
        >
          ❤️
        </div>
      ))}
    </div>
  )
}
