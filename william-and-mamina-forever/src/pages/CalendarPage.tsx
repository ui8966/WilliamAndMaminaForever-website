// src/pages/CalendarPage.tsx
import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import {
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'

interface Event {
  date: string
  emojis: string[]
  notes?: string
}

export default function CalendarPage() {
  const [value, onChange] = useState(new Date())
  const [events, setEvents] = useState<Record<string, Event>>({})
  const [modalDate, setModalDate] = useState<string | null>(null)
  const [form, setForm] = useState({ emojis: '', notes: '' })

  // 1️⃣ Subscribe to all events in Firestore
  useEffect(() => {
    const col = collection(firestore, 'events')
    const unsub = onSnapshot(
      col,
      (snap: QuerySnapshot<DocumentData>) => {
        const evts: Record<string, Event> = {}
        snap.docs.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
          const data = d.data() as Event
          evts[data.date] = data
        })
        setEvents(evts)
      }
    )
    return () => unsub()
  }, [])

  // 2️⃣ Open modal when a day is clicked
  function handleDayClick(date: Date) {
    const key = date.toISOString().slice(0, 10)
    const ev = events[key]
    setForm({ emojis: ev?.emojis.join('') || '', notes: ev?.notes || '' })
    setModalDate(key)
  }

  // 3️⃣ Save or delete the event
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!modalDate) return

    const emojis = Array.from(form.emojis)
    const ref = doc(firestore, 'events', modalDate)

    if (emojis.length === 0 && !form.notes) {
      // nothing left → delete
      await deleteDoc(ref)
    } else {
      // upsert
      await setDoc(ref, {
        date: modalDate,
        emojis,
        notes: form.notes,
        updatedAt: serverTimestamp(),
      })
    }
    setModalDate(null)
  }

  return (
    <div className="p-4">
      <div className="mx-auto w-full max-w-7xl min-h-[80vh]">
        <Calendar
          onChange={onChange}
          value={value}
          onClickDay={handleDayClick}
          className="rounded-2xl shadow-lg overflow-hidden"
          navigationClassName="flex items-center justify-center space-x-8 px-4 py-2"
          minDetail="month"
          maxDetail="month"
          prev2Label={null}
          next2Label={null}
          prevLabel={<span className="text-6xl md:text-9xl mx-6">‹</span>}
          nextLabel={<span className="text-6xl md:text-9xl mx-6 ">›</span>}
          navigationLabel={({ label }: { label: string }) => (
            <span className="block mb-4 text-5xl md:text-6xl font-heading ">{label}</span>
          )}
          tileContent={({ date, view }: { date: Date; view: string }) => {
            if (view !== 'month') return null
            const key = date.toISOString().slice(0, 10)
            const ev = events[key]
            return ev?.emojis.length ? (
              <div className="text-center mt-3 text-6xl">
                {ev.emojis.join('')}
              </div>
            ) : null
          }}
          tileClassName={({ date, view }: { date: Date; view: string }) => {
            if (view !== 'month') return ''
            const base = [
              'p-6',
              'h-64',
              'border',
              'border-gray-200',
              'rounded-lg',
              'flex',
              'flex-col',
              'items-center',
              'justify-start',
              'text-4xl',
            ].join(' ')
            return date.toDateString() === new Date().toDateString()
              ? `${base} bg-blue-100 font-bold`
              : base
          }}
        />
      </div>

      {/* 4️⃣ Day-click modal */}
      {modalDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-6">
          <div className="relative bg-white rounded-2xl w-full max-w-4xl overflow-hidden">
            {/* ← Prev / Next arrows */}
            <button
              onClick={() => {
                const prev = new Date(modalDate)
                prev.setDate(prev.getDate() - 1)
                setModalDate(prev.toISOString().slice(0,10))
                const ev = events[prev.toISOString().slice(0,10)]
                setForm({ emojis: ev?.emojis.join('')||'', notes: ev?.notes||'' })
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-9xl  text-gray-400 hover:text-gray-600"
              title="Previous day"
            >
              ‹
            </button>

            <button
              onClick={() => {
                const next = new Date(modalDate)
                next.setDate(next.getDate() + 1)
                setModalDate(next.toISOString().slice(0,10))
                const ev = events[next.toISOString().slice(0,10)]
                setForm({ emojis: ev?.emojis.join('')||'', notes: ev?.notes||'' })
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-9xl  text-gray-400 hover:text-gray-600"
              title="Next day"
            >
              ›
            </button>

            <form
              onSubmit={handleSave}
              className="p-9 space-y-10"
            >
              <h3 className="text-6xl font-heading text-center">
                {new Date(
                    new Date(modalDate).getTime() + 24 * 60 * 60 * 1000
                  ).toLocaleDateString()}
              </h3>

            <label className="block">
              <span className="block mb-2 text-4xl">Emojis:</span>
              <input
                type="text"
                value={form.emojis}
                onChange={(e) =>
                  setForm((f) => ({ ...f, emojis: e.target.value }))
                }
                className="w-full border border-gray-300 rounded p-5 text-5xl text-center"
                placeholder="Pick 1-2 emojis…"
              />
            </label>

            <label className="block">
              <span className="block mb-2 text-4xl">Notes:</span>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={7}
                className="w-full border border-gray-300 rounded p-5 text-5xl"
                placeholder="Optional details…"
              />
            </label>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setModalDate(null)}
                className="px-10 py-3 text-2xl rounded-md border"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-10 py-3 text-2xl bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Save
              </button>
            </div>
          </form>
          </div>
        </div>
      )}
    </div>
  )
}
