// src/pages/HomePage.tsx
import TogetherTimer from '../components/TogetherTimer'
import CountdownTimer from '../components/CountdownTimer'
import FloatingHearts from '../components/FloatingHearts'
import TimerWithHoverHeart from '../components/TimerWithHoverHeart'
import PetalBackground  from '../components/PetalBackground'
import LocalCityCard from '../components/LocalCityCard'
import type { City } from '../components/LocalCityCard'


 const CITIES: City[] = [

  { name: 'Oslo',  lat: 59.91, lon: 10.75, locale: 'en-GB', timezone: 'Europe/Oslo' },
  { name: 'Osaka', lat: 34.69, lon: 135.50, locale: 'ja-JP', timezone: 'Asia/Tokyo' },
 ]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-pink-gradient flex flex-col items-center justify-center text-center p-4 font-body">
      <FloatingHearts />
      <PetalBackground /> 

      <h1 className="text-4xl md:text-6xl font-heading text-pink-600 mb-6 animate-bounce-slow">
        💖 William & Mamina Forever 💖
      </h1>

      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl space-y-6">
        <p className="text-2xl md:text-4xl font-body">We’ve been together for:</p>
        <TimerWithHoverHeart>
          <TogetherTimer />
        </TimerWithHoverHeart>

        <p className="text-2xl md:text-4xl font-body">Until we meet again:</p>
        <TimerWithHoverHeart>
          <CountdownTimer />
        </TimerWithHoverHeart>
      </div>

      <div className="mt-8 flex flex-col md:flex-row justify-around space-y-4 md:space-y-0 md:space-x-6 w-full max-w-2xl">
        {CITIES.map(c => <LocalCityCard key={c.name} city={c} />)}
      </div>
    </div>
  )
}
