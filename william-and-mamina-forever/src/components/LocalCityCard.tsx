// src/components/LocalCityCard.tsx
import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { formatTime } from './LocalClocks'   

export interface City {
  name: string
  lat: number
  lon: number
  locale: string
  timezone: string
}

interface Weather {
  temperature: number
  conditionId: number
}

function weatherEmoji(id: number): string {
  if (id >= 200 && id < 300)  return '⛈️'
  if (id >= 300 && id < 500)  return '🌦️'
  if (id >= 500 && id < 600)  return '🌧️'
  if (id >= 600 && id < 700)  return '🌨️'
  if (id >= 700 && id < 800)  return '🌫️'
  if (id === 800)             return '☀️'
  if (id === 801)             return '🌤️'
  if (id > 801 && id < 900)   return '☁️'
  return '❓'
}

export default function LocalCityCard({ city }: { city: City }) {
  const [now, setNow] = useState(new Date())
  const [weather, setWeather] = useState<Weather | null>(null)

  // tick every second, same as your old LocalClocks
  useEffect(() => {
    const tid = setInterval(() => setNow(new Date()), 1_000)
    return () => clearInterval(tid)
  }, [])

  // fetch from OpenWeatherMap
  useEffect(() => {
    const key = import.meta.env.VITE_OPENWEATHER_API_KEY
    fetch(
      `https://api.openweathermap.org/data/2.5/weather` +
      `?lat=${city.lat}&lon=${city.lon}` +
      `&units=metric&appid=${key}`
    )
      .then(r => r.json())
      .then(json => {
        if (json.main && json.weather?.[0]) {
          setWeather({
            temperature: json.main.temp,
            conditionId: json.weather[0].id
          })
        }
      })
      .catch(console.error)
  }, [city.lat, city.lon])

  return (
    <div className="flex-1 bg-white rounded-xl shadow-md p-6 space-y-4">
      <h3 className="text-4xl font-medium text-pink-600">
        {city.name}
      </h3>

      {/* Clock (unchanged formatting) */}
      <div className="flex items-center justify-center space-x-2">
        <Clock className="w-8 h-8 text-gray-500" />
        <span className="text-5xl font-mono">
            {formatTime(now, city.locale, city.timezone)}
        </span>
      </div>

      {/* Weather */}
      {weather ? (
        <div className="flex items-center justify-center space-x-3">
          <span className="text-6xl">
            {weatherEmoji(weather.conditionId)}
          </span>
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
