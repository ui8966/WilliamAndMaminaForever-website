// src/components/CountdownTimer.tsx
import { useEffect, useState } from 'react'

// Your next-meet date:
const MEET_DATE = new Date('2025-07-09T00:00:00')

export default function CountdownTimer() {
  const [days, setDays] = useState(() => {
    const now = Date.now()
    const delta = MEET_DATE.getTime() - now
    return Math.max(0, Math.floor(delta / (1000 * 60 * 60 * 24)))
  })

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      const delta = MEET_DATE.getTime() - now
      setDays(Math.max(0, Math.floor(delta / (1000 * 60 * 60 * 24))))
    }, 60_000) // update once per minute is enough
    return () => clearInterval(id)
  }, [])

  return (
    <div className="text-2xl font-mono text-pink-600">
      {days} days
    </div>
  )
}
