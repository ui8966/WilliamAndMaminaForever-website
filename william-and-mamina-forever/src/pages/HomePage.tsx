// src/pages/HomePage.tsx
import TogetherTimer from '../components/TogetherTimer'
import CountdownTimer from '../components/CountdownTimer'
import FloatingHearts from '../components/FloatingHearts'
import TimerWithHoverHeart from '../components/TimerWithHoverHeart'
import PetalBackground  from '../components/PetalBackground'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-pink-gradient flex flex-col items-center justify-center text-center p-4 font-body">
      <FloatingHearts />
      <PetalBackground /> 

      <h1 className="text-4xl md:text-6xl font-heading text-pink-600 mb-6 animate-bounce-slow">
        💖 William & Mamina Forever 💖
      </h1>

      <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-md space-y-4">
        <p className="text-2xl md:text-3xl font-body">We’ve been together for:</p>
        <TimerWithHoverHeart>
          <TogetherTimer />
        </TimerWithHoverHeart>

        <p className="text-2xl md:text-3xl font-body">Countdown until we meet:</p>
        <TimerWithHoverHeart>
          <CountdownTimer />
        </TimerWithHoverHeart>
      </div>
    </div>
  )
}
