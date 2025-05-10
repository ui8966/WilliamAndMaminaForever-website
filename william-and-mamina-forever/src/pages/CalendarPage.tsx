// src/pages/CalendarPage.tsx

export default function CalendarPage() {
  // Today's year and month
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const monthLabel = `${year}年${String(month).padStart(2, '0')}月`

  // Weekday labels in Japanese
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']

  // Compute days in month and the starting weekday
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  // Build calendar cells: empty slots then day numbers
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(day)

  return (
    <div className="p-4">
      {/* Month label */}
      <h2 className="text-3xl font-heading text-center mb-4">{monthLabel}</h2>

      {/* Weekday header */}
      <div className="grid grid-cols-7 text-center text-sm mb-1">
        {weekdays.map((wd) => (
          <div key={wd} className="font-medium text-pink-600">
            {wd}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => (
          <div
            key={idx}
            className={`h-12 flex items-center justify-center rounded-lg cursor-pointer
              ${day === today.getDate() ? 'bg-pink-200 font-bold' : ''}
              ${day === null ? 'bg-transparent' : 'bg-white shadow-sm'}`}
          >
            {day ?? ''}
          </div>
        ))}
      </div>
    </div>
  )
}
