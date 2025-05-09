
export default function PetalBackground() {
  // generate 20 petals
  const petals = Array.from({ length: 20 });

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {petals.map((_, i) => {
        const left     = Math.random() * 100;               // 0–100%
        const size     = 2 + Math.random() * 3;             // 2–5 rem
        const delay    = Math.random() * -15;               // start at random negative delay
        const duration = 10 + Math.random() * 10;           // 10–20s fall

        return (
          <div
            key={i}
            className="absolute"
            style={{
              left:          `${left}%`,
              fontSize:      `${size}rem`,
              animationName: 'fall',
              animationDuration: `${duration}s`,
              animationDelay:    `${delay}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
            }}
          >
            🌸
          </div>
        )
      })}
    </div>
  );
}
