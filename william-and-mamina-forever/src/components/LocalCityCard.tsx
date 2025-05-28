// src/components/LocalCityCard.tsx
import { useEffect, useState } from 'react'

export interface City {
  name: string
  lat: number
  lon: number
  timezone: string
}

interface Weather {
  temperature: number
  weatherCode: number
}

// Open-Meteo weathercode → emoji
function weatherEmoji(code: number): string {
  if (code === 0)               return '☀️'
  if (code === 1 || code === 2) return '🌤️'
  if (code === 3)               return '☁️'
  if (code >= 45 && code <= 48) return '🌫️'
  if (code >= 51 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 77) return '🌨️'
  if (code >= 80 && code <= 82) return '🌦️'
  if (code >= 95)               return '⛈️'
  return '❓'
}

export default function LocalCityCard({ city }: { city: City }) {
  const [now, setNow] = useState(new Date())
  const [weather, setWeather] = useState<Weather | null>(null)

  // tick every second, unchanged
  useEffect(() => {
    const tid = setInterval(() => setNow(new Date()), 1_000)
    return () => clearInterval(tid)
  }, [])

  // fetch current weather from Open-Meteo
  useEffect(() => {
    fetch(
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${city.lat}&longitude=${city.lon}` +
      `&current_weather=true` +
      `&timezone=${encodeURIComponent(city.timezone)}`
    )
      .then(r => r.json())
      .then(json => {
        if (json.current_weather) {
          setWeather({
            temperature: json.current_weather.temperature,
            weatherCode: json.current_weather.weathercode,
          })
        }
      })
      .catch(console.error)
  }, [city.lat, city.lon, city.timezone])

  return (
    <div className="flex-1 bg-white rounded-xl shadow-md p-6 space-y-4">
      <h3 className="text-4xl font-medium text-pink-600">
        {city.name}
      </h3>

      {/* Clock (12-hour with AM/PM) */}
      <div className="text-5xl font-mono">
        {now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: city.timezone,
        })}
      </div>

      {/* Weather */}
      {weather ? (
        <div className="flex items-center justify-center space-x-3">
          <span className="text-6xl">{weatherEmoji(weather.weatherCode)}</span>
          <span className="text-4xl font-mono">
            {Math.round(weather.temperature)}°C
          </span>
        </div>
      ) : (
        <p className="text-lg text-gray-500">Loading weather…</p>
      )}
    </div>
  )
}
