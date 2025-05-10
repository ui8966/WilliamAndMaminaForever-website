// src/pages/CalendarPage.tsx
import { useState } from 'react'
import Calendar from 'react-calendar' 

const emojiMap: Record<string, string> = {
   '2025-04-04': '🇳🇴❤️',
   '2025-05-17': '🎂',
   '2025-06-09': '🎁',
   '2025-08-07': '✈️',
   '2025-07-09': '🇯🇵',
   '2025-07-13': '🌸🏝️',
   '2025-07-18': '🇰🇷',
 }
 
export default function CalendarPage() {
  const [value, onChange] = useState(new Date())

  return (
    <div className="p-4">
      <h2 className="text-3xl font-heading text-center mb-4">
        {value.getFullYear()}年
        {String(value.getMonth()+1).padStart(2,'0')}月
      </h2>

      <div className="mx-auto w-full max-w-7xl">
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
                ? <div className="text-center mt-1 text-xl">{emoji}</div>
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
     'h-32',
     'border', 'border-gray-200',
     'rounded-lg',
     'flex', 'items-center', 'justify-center',
     'text-3xl',
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
