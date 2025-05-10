// src/pages/CalendarPage.tsx
import { useState } from 'react'
import Calendar from 'react-calendar' 

const emojiMap: Record<string, string> = {
   '2025-04-04': '🇳🇴❤️',
   '2025-05-17': '🎂',
   '2025-06-09': '🎂',
   '2025-07-07': '✈️',
   '2025-07-09': '🇯🇵',
   '2025-07-10': '🐙',
   '2025-07-11': '🇯🇵',
   '2025-07-12': '🐙',
   '2025-07-13': '🏝️',
   '2025-07-14': '🌸',
   '2025-07-15': '🌊',
   '2025-07-16': '🏖️',
   '2025-07-17': '🏖️',
   '2025-07-18': '🇰🇷',
   '2025-07-19': '🇰🇷',
   '2025-07-20': '🇰🇷',
   '2025-07-21': '🇰🇷',
 }
 
export default function CalendarPage() {
  const [value, onChange] = useState(new Date())

  return (
    <div className="p-4">

      <div className="mx-auto w-full max-w-7xl min-h-[80vh]">
        <Calendar
          onChange={onChange}
          value={value}
          className="rounded-2xl shadow-lg overflow-hidden"
          minDetail="month"
          maxDetail="month"
          prev2Label={null}
          next2Label={null}
          /* make the prev/next buttons gigantic test */
          prevLabel={<span className="text-6xl md:text-7xl px-">‹</span>}
          nextLabel={<span className="text-6xl md:text-7xl px-2">›</span>}
          /* replace the month/year label with a big font too */
          navigationLabel={({ label }: { label: string }) => (
            <span className="text-5xl md:text-6xl font-heading">
      {label}
    </span>
  )}
          tileContent={({
            date,
            view,
          }: {
            date: Date
            view: 'month'
          }) => {
            if (view === 'month') {
              const key =
              `${date.getFullYear()}-` +
              `${(date.getMonth()+1).toString().padStart(2,'0')}-` +
              `${date.getDate().toString().padStart(2,'0')}`

              const emoji = emojiMap[key]
              return emoji
                ? <div className="text-center mt-3 text-6xl">{emoji}</div>
                : null
            }
          }}
tileClassName={({
   date,
   view,
 }: {
   date: Date
   view: 'month'
 }) => {
   // only apply a box on month view
   if (view !== 'month') return ''

   // base box styles
   const base = [
     'p-6',
     'h-64',
     'md:h-67', 
     'border', 'border-gray-200',
     'rounded-lg',
     'flex','flex-col','items-center','justify-start',
     'text-4xl',
   ].join(' ')

   // highlight today
   if (date.toDateString() === new Date().toDateString()) {
     return `${base} bg-pink-100 font-bold`
   }

   return base
 }}
        />
      </div>
    </div>
  )
}
