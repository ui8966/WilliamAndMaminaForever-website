// src/components/LocalClocks.tsx
import { useEffect, useState } from 'react'

// import the helper from a separate file
import { formatTime } from '../utils/formatTime'

export default function LocalClocks() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="mt-8 flex flex-col md:flex-row justify-around space-y-4 md:space-y-0 md:space-x-6 w-full max-w-2xl">
      <div className="flex-1 bg-white rounded-lg shadow-md p-4">
        <h3 className="text-4xl font-medium text-pink-600 mb-2">Oslo</h3>
        <p className="text-6xl font-mono">
          {formatTime(now, 'en-GB', 'Europe/Oslo')}
        </p>
      </div>
      <div className="flex-1 bg-white rounded-lg shadow-md p-4">
        <h3 className="text-4xl font-medium text-pink-600 mb-2">Osaka</h3>
        <p className="text-6xl font-mono">
          {formatTime(now, 'ja-JP', 'Asia/Tokyo')}
        </p>
      </div>
    </div>
  )
}
