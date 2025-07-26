// src/components/CountdownTimer.tsx
import { useEffect, useState } from 'react'

// Your next meetup date (midnight local on July 9):
const MEET_DATE = new Date('2025-12-31T00:00:00')

interface Countdown { days: number; hours: number; minutes: number }

function calculateCountdown(to: Date): Countdown {
  const now = Date.now()
  const delta = Math.max(0, to.getTime() - now)
  const days  = Math.floor(delta / (1000 * 60 * 60 * 24))
  const hours = Math.floor((delta % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((delta % (1000 * 60 * 60)) / (1000 * 60))
  return { days, hours, minutes }
}

export default function CountdownTimer() {
  const [count, setCount] = useState<Countdown>(() => calculateCountdown(MEET_DATE))

  useEffect(() => {
    const id = setInterval(() => {
      setCount(calculateCountdown(MEET_DATE))
    }, 60_000) // update hourly
    return () => clearInterval(id)
  }, [])

  return (
    <div className="text-4xl md:text-6xl font-mono text-pink-600">
      {count.days}d {count.hours}h {count.minutes}m
    </div>
  )
}
