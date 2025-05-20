// src/utils/formatTime.ts
export function formatTime(date: Date, locale: string, timeZone: string) {
  return date.toLocaleTimeString(locale, {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone,
  })
}