// src/components/TogetherTimer.tsx
import { useEffect, useState } from 'react'

// Your start date:
const START_DATE = new Date('2025-04-04T00:00:00')

interface TimeDiff {
  years: number
  months: number
  days: number
}

function calculateDiff(from: Date, to: Date): TimeDiff {
  let years = to.getFullYear() - from.getFullYear()
  let months = to.getMonth() - from.getMonth()
  let days = to.getDate() - from.getDate()

  if (days < 0) {
    const prevMonth = new Date(to.getFullYear(), to.getMonth(), 0)
    days += prevMonth.getDate()
    months--
  }
  if (months < 0) {
    months += 12
    years--
  }

  return { years, months, days }
}

export default function TogetherTimer() {
  const [diff, setDiff] = useState<TimeDiff>(
    () => calculateDiff(START_DATE, new Date())
  )

  useEffect(() => {
    const id = setInterval(() => {
      setDiff(calculateDiff(START_DATE, new Date()))
    }, 1000) // you can even make this 60 000 (once a minute) since seconds aren’t shown
    return () => clearInterval(id)
  }, [])

  return (
    <div className="text-2xl font-mono text-pink-600">
      {diff.years}y {diff.months}m {diff.days}d
    </div>
  )
}
