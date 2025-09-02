// src/pages/GalleryPage.tsx
import { useState, useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png?url'
import markerIcon   from 'leaflet/dist/images/marker-icon.png?url'
import markerShadow from 'leaflet/dist/images/marker-shadow.png?url'
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})
import { MapContainer, TileLayer, Marker, Tooltip} from 'react-leaflet'
import type { FormEvent } from 'react'
import { useMemo } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from 'firebase/firestore'
import { firestore, storage } from '../lib/firebase'
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface Photo {
  id: string
  url: string
  path: string       // storage path, for deletion
  caption: string
  date: string       // ISO YYYY-MM-DD
  place: string
  time?: string       // "HH:mm" (optional)
  takenAt?: string    // ISO datetime (optional)
}

const PIN_SCALE = 3; // tweak between 1.5–2.0 to taste

export const leafletDefaultIcon = new L.Icon({
  iconUrl: markerIcon,          // keep standard + retina for best clarity
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,

  // base (25x41) * scale
  iconSize: [Math.round(25 * PIN_SCALE), Math.round(41 * PIN_SCALE)],

  // keep the point of the pin at the correct lat/lng (bottom-center)
  iconAnchor: [Math.round(12 * PIN_SCALE), Math.round(41 * PIN_SCALE)],

  // position popups/tooltips relative to the bigger icon
  popupAnchor: [Math.round(1 * PIN_SCALE), Math.round(-34 * PIN_SCALE)],
  tooltipAnchor: [Math.round(16 * PIN_SCALE), Math.round(-28 * PIN_SCALE)],

  // scale the shadow too (not critical if you want to keep default)
  shadowSize: [Math.round(41 * PIN_SCALE), Math.round(41 * PIN_SCALE)],
});

function SimpleMap({
  points,
  onOpenPhoto,
}: {
  points: { id: string; lat: number; lng: number; caption: string }[]
  onOpenPhoto: (id: string) => void
}) {
  const mapRef = useRef<L.Map | null>(null)
  const [ready, setReady] = useState(false);


  // Fit once when points first appear or the count changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (points.length === 0) {
      map.setView([20, 0], 2)
      return
    }
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng] as [number, number]))
    map.fitBounds(bounds.pad(0.2), { animate: false })
  }, [points.length])

  
  return (
    <div className="relative h-full w-full">
      <MapContainer
        whenReady={() => setReady(true)}
        // if tiles ever hang, changing this key remounts the map (see below)
        // key={mapKey}
        ref={mapRef}
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom
        tapTolerance={20}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map(p => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={leafletDefaultIcon}
                  eventHandlers={{ click: () => onOpenPhoto(p.id) }}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="text-sm font-medium">{p.caption}</div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-white/70">
          <div className="rounded-xl px-4 py-2 text-gray-700 shadow">Loading map…</div>
        </div>
      )}
    </div>
  );
}

export default function GalleryPage() {
  // --- state ---
  const [photos, setPhotos] = useState<Photo[]>([])
  type ViewType = 'byDate' | 'byPlace' | 'all' | 'map'
  const [view, setView]           = useState<ViewType>('byDate')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editOpen, setEditOpen]     = useState<Photo | null>(null)
  const [previewOpen, setPreviewOpen] = useState<Photo | null>(null)

  // upload form
  const [files, setFiles]   = useState<File[]>([])
  const [caption, setCaption] = useState('')
  const [date, setDate]       = useState<string>('')
  const [place, setPlace]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [time, setTime] = useState<string>('')        // upload form
  const [eTime, setETime] = useState<string>('')      // edit form

  // edit form (populated from editOpen)
  const [eCaption, setECaption] = useState('')
  const [eDate, setEDate]       = useState('')
  const [ePlace, setEPlace]     = useState('')

  const [setTimeOpen, setSetTimeOpen] = useState<Photo | null>(null)
  const [quickTime, setQuickTime] = useState<string>('')
  const longPressTimer = useRef<number | null>(null)

  // cache of geocoded places -> coords
  const [placeCoords, setPlaceCoords] =
    useState<Record<string, { lat: number; lng: number }>>({})

  // slug/id for the "places" collection
  const keyForPlace = (s: string) =>
    s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')

  /// Mapbox if token exists, otherwise OpenStreetMap (Nominatim) with no key.
  async function geocodePlace(place: string): Promise<{ lat: number; lng: number } | null> {
    const token = import.meta.env.VITE_MAPBOX_TOKEN

    const quick: Record<string, { lat: number; lng: number }> = {
      "oslo, norway": { lat: 59.9139, lng: 10.7522 },
    }
    const key = place.trim().toLowerCase()
    if (quick[key]) return quick[key]

    try {
      if (token) {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}.json?access_token=${token}&limit=1`
        const res = await fetch(url)
        const data = await res.json()
        const f = data?.features?.[0]
        if (!f?.center) return null
        const [lng, lat] = f.center
        return { lat, lng }
      } else {
        // Nominatim (no token). We cache results in Firestore so this is light.
        const email = import.meta.env.VITE_NOMINATIM_EMAIL // optional courtesy
        const url =
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}` +
          (email ? `&email=${encodeURIComponent(email)}` : '')
        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        const arr = await res.json()
        const hit = Array.isArray(arr) ? arr[0] : null
        if (!hit) return null
        return { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) }
      }
    } catch (e) {
      console.error('Geocode failed', e)
      return null
    }
  }


  // --- fetch all photos ---
  useEffect(() => {
    const col = collection(firestore, 'photos')
    const unsub = onSnapshot(col, (snap: QuerySnapshot<DocumentData>) => {
      const list: Photo[] = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
        const data = d.data()
        return {
          id:        d.id,
          url:       data.url,
          path:      data.path,
          caption:   data.caption,
          date:      data.date,
          place:     data.place,
          time:      data.time ?? undefined,
          takenAt:   data.takenAt ?? undefined,
        }
      })
      setPhotos(list)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // unique, non-empty places
      const uniquePlaces = Array.from(
        new Set(photos.map(p => p.place).filter(Boolean))
      )

      for (const place of uniquePlaces) {
        if (cancelled) break
        if (placeCoords[place]) continue

        // 1) check Firestore cache
        const id = keyForPlace(place)
        const ref = doc(firestore, 'places', id)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const d = snap.data() as { lat?: number; lng?: number }
          if (typeof d.lat === 'number' && typeof d.lng === 'number') {
            if (!cancelled) {
              setPlaceCoords(prev => ({
                ...prev,
                [place]: { lat: d.lat as number, lng: d.lng as number }
              }))
            }
            continue
          }
        }

      // 2) geocode if we have a token (or Nominatim)
      const coords = await geocodePlace(place)
      if (coords) {
        // try to cache to Firestore, but don't let failures stop UI
        try {
          await setDoc(ref, { place, ...coords, createdAt: serverTimestamp() })
        } catch (err) {
          console.warn('Caching place failed (ok to ignore):', place, err)
        }
        if (!cancelled) {
          setPlaceCoords(prev => ({ ...prev, [place]: coords }))
        }
      }
      }
    })()
    return () => { cancelled = true }
  }, [photos]) // eslint-disable-line react-hooks/exhaustive-deps


  // --- upload handler ---
  async function handleUpload(e: FormEvent) {
    e.preventDefault()
    if (!files.length) return
    setSaving(true)
    try {
      for (const file of files) {
        const uuid = crypto.randomUUID()
        const path = `photos/${uuid}_${file.name}`
        const ref = storageRef(storage, path)
        const task = uploadBytesResumable(ref, file)
        await new Promise((res, rej) =>
          task.on('state_changed', null, rej, () => res(undefined))
        )

        const localTime = time || '12:00'
        const takenAtISO = date ? new Date(`${date}T${localTime}:00`).toISOString() : null

        const url = await getDownloadURL(ref)
        await addDoc(collection(firestore, 'photos'), {
          url,
          path,
          caption,
          date,
          place,
          time: time || null,
          takenAt: takenAtISO,
          createdAt: serverTimestamp(),
        })
      }
      // reset form
      setFiles([])
      setCaption('')
      setDate('')
      setPlace('')
      setTime('')
      setUploadOpen(false)
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setSaving(false)
    }
  }

  // --- edit handler ---
  async function handleEdit(e: FormEvent) {
    e.preventDefault()
    if (!editOpen) return
    setSaving(true)
    try {
      const localTime = eTime || '12:00'
      const newTakenAt = eDate ? new Date(`${eDate}T${localTime}:00`).toISOString() : null
      const ref = doc(firestore, 'photos', editOpen.id)
      await updateDoc(ref, {
        caption: eCaption,
        date:    eDate,
        place:   ePlace,
        time:     eTime || null,
        takenAt:  newTakenAt,
        updatedAt: serverTimestamp(),
      })
      setEditOpen(null)
    } catch (err) {
      console.error('Update failed', err)
    } finally {
      setSaving(false)
    }
  }

  // --- delete handler ---
  async function handleDelete(p: Photo) {
    if (!confirm('Delete this photo permanently?')) return
    try {
      // remove storage file
      await deleteObject(storageRef(storage, p.path))
      // remove firestore doc
      await deleteDoc(doc(firestore, 'photos', p.id))
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => {
      const A = a.takenAt || a.date
      const B = b.takenAt || b.date
      return A.localeCompare(B)
    })
  }, [photos])

   // --- grouping for the two new views ---
  const byDateGroups = useMemo(() => {
  return sortedPhotos.reduce<Record<string, Photo[]>>((acc, p) => {
    (acc[p.date] ??= []).push(p)
    return acc
  }, {})
}, [sortedPhotos])

 const byPlaceGroups = useMemo(() => {
   return sortedPhotos.reduce<Record<string, Photo[]>>((acc, p) => {
     const city = p.place.split(',')[0];
     (acc[city] ??= []).push(p);
     return acc;
   }, {});
}, [sortedPhotos]);

const simplePoints = useMemo(() => {
  return sortedPhotos.flatMap(p => {
    const c = placeCoords[p.place]
    if (!c) return []
    return [{
      id: p.id,
      lat: c.lat,
      lng: c.lng,
      caption: p.caption || 'Photo',
    }]
  })
}, [sortedPhotos, placeCoords])

   function startLongPress(p: Photo) {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current)
    longPressTimer.current = window.setTimeout(() => {
      setSetTimeOpen(p)
      setQuickTime(p.time || '')
    }, 500) as unknown as number
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }


  return (
    <div className="p-4 bg-gradient-to-b from-sky-200 via-blue-100 min-h-screen">
      {/* Upload button */}
      <button
        onClick={() => setUploadOpen(true)}
        className="fixed z-50 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 9rem)' }}
      >
        <Plus className="w-20 h-20" />
      </button>

      {/* ─── TAB BAR ───────────────────────────── */}
   <nav className="flex space-x-6 mb-8">
     {[
       { key: 'byDate',  label: 'By Date'   },
       { key: 'byPlace', label: 'By Place'  },
       { key: 'all',     label: 'All Photos' },
       { key: 'map', label:'Map View' },
     ].map(tab => (
       <button
         key={tab.key} 
         onClick={() => setView(tab.key as ViewType)}
         className={`
           px-7 py-4 rounded-md text-3xl font-medium
           ${view===tab.key ? 'bg-blue-600 text-white' : 'bg-white shadow'}
         `}
       >
         {tab.label}
       </button>
     ))}
   </nav>

   {/* ─── ALL PHOTOS ───────────────────────── */}
{view==='all' && (
  <div className="grid grid-cols-2 gap-6">
    {sortedPhotos.map(p => (
      <div key={p.id} className="relative bg-white rounded-2xl shadow overflow-hidden">
        {/* Preview on click */}
        <button
          onClick={() => setPreviewOpen(p)}
          onMouseDown={() => startLongPress(p)}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
          onTouchStart={() => startLongPress(p)}
          onTouchEnd={cancelLongPress}
          className="block w-full focus:outline-none"
        >
        <img
          src={p.url}
          alt={p.caption}
          className="w-full h-72 md:h-96 lg:h-[1000px] object-cover"
        />
        <div className="p-6 space-y-2 text-left">
          {/* Date */}
          <div className="text-base text-gray-600">
            {format(new Date(p.date), 'PPP')}
          </div>
          {/* Place */}
          <div className="text-base text-gray-600">
            {p.place}
          </div>
          {/* Caption */}
          <div className="text-2xl font-medium text-gray-800">
            {p.caption}
          </div>
        </div>
        </button>
        {/* ← edit/delete controls */}
        <div className="absolute top-4 right-4 flex space-x-3">
          <button
            onClick={() => {
              setEditOpen(p)
              setECaption(p.caption)
              setEDate(p.date)
              setEPlace(p.place)
              setETime(p.time || '')
            }}
            className="bg-white rounded-full p-5 shadow hover:bg-blue-50 text-2xl"
            title="Edit"
          >
            <Edit2 className="w-10 h-10 text-blue-600" />
          </button>
          <button
            onClick={() => handleDelete(p)}
            className="bg-white rounded-full p-5 shadow hover:bg-blue-50 text-2xl"            title="Delete"
          >
            <Trash2 className="w-10 h-10 text-red-600" />
          </button>
        </div>
      </div>
    ))}
  </div>
)}

   {/* ─── BY DATE ───────────────────────────── */}
   {view==='byDate' && (
  <div className="space-y-8">
    {Object.entries(byDateGroups).map(([d,list]) => (
      <section key={d}>
        <h2 className="text-4xl font-heading text-blue-600 mb-4">
          {format(new Date(d), 'PPP')}
        </h2>
        <div className="grid grid-cols-2 gap-6">
          {list.map(p => (
            <div key={p.id} className="relative bg-white rounded-2xl shadow overflow-hidden">
            <button
              onClick={() => setPreviewOpen(p)}
              onMouseDown={() => startLongPress(p)}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              onTouchStart={() => startLongPress(p)}
              onTouchEnd={cancelLongPress}
              className="block w-full focus:outline-none"
            >
              <img
                src={p.url}
                alt={p.caption}
                className="w-full h-72 md:h-96 lg:h-[1000px] object-cover"
              />
             <div className="p-6 space-y-2 text-left">
              <div className="text-2xl font-medium text-gray-800">
                {p.caption}
              </div>
              <div className="text-base text-gray-600">
                {p.place}
              </div>
            </div>
            </button>
              {/* ← edit/delete */}
              <div className="absolute top-4 right-4 flex space-x-3">
                <button
                  onClick={() => {
                    setEditOpen(p)
                    setECaption(p.caption)
                    setEDate(p.date)
                    setEPlace(p.place)
                    setETime(p.time || '') 
                  }}
                  className="bg-white rounded-full p-5 shadow hover:bg-blue-50 text-2xl"
                  title="Edit"
                >
                  <Edit2 className="w-10 h-10 text-blue-600" />
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="bg-white rounded-full p-5 shadow hover:bg-blue-50 text-2xl"
                  title="Delete"
                >
                  <Trash2 className="w-10 h-10 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    ))}
  </div>
)}

   {/* ─── BY PLACE ──────────────────────────── */}
   {view==='byPlace' && (
  <div className="space-y-8">
    {Object.entries(byPlaceGroups).map(([city,list]) => (
      <section key={city}>
        <h2 className="text-4xl font-heading text-blue-600 mb-4">{city}</h2>
        <div className="grid grid-cols-2 gap-6">
          {list.map(p => (
            <div key={p.id} className="relative bg-white rounded-2xl shadow overflow-hidden">
            <button
              onClick={() => setPreviewOpen(p)}
              onMouseDown={() => startLongPress(p)}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              onTouchStart={() => startLongPress(p)}
              onTouchEnd={cancelLongPress}
              className="block w-full focus:outline-none"
            >
              <img
                src={p.url}
                alt={p.caption}
                className="w-full h-72 md:h-96 lg:h-[1000px] object-cover"
              />
              <div className="p-6 space-y-2 text-left">
                <div className="text-base text-gray-600">
                  {format(new Date(p.date), 'PPP')}
                </div>
                <div className="text-2xl font-medium text-gray-800">
                  {p.caption}
                </div>
              </div>
              </button>
              {/* ← edit/delete */}
              <div className="absolute top-4 right-4 flex space-x-3">
                <button
                  onClick={() => {
                    setEditOpen(p)
                    setECaption(p.caption)
                    setEDate(p.date)
                    setEPlace(p.place)
                    setETime(p.time || '')
                  }}
                  className="bg-white rounded-full p-5 shadow hover:bg-blue-100"
                  title="Edit"
                >
                  <Edit2 className="w-10 h-10 text-blue-600" />
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="bg-white rounded-full p-5 shadow hover:bg-blue-50 text-2xl"
                  title="Delete"
                >
                  <Trash2 className="w-10 h-10 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    ))}
  </div>
)}

{view === 'map' && (
  <div className="relative h-[70vh] rounded-2xl overflow-hidden shadow">
    <SimpleMap
      points={simplePoints}
      onOpenPhoto={(id) => {
        const p = sortedPhotos.find(pp => pp.id === id)
        if (p) setPreviewOpen(p)
      }}
    />

    {simplePoints.length === 0 && (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-white/90 px-6 py-4 rounded-xl shadow text-center">
          <div className="text-lg font-semibold text-gray-800">No locations yet</div>
          <div className="text-gray-600 mt-1">
            Add photos with a <em>Place</em> (e.g., “Oslo, Norway”).
          </div>
        </div>
      </div>
    )}
  </div>
)}



      {/* ─── bottom spacer so last caption scrolls up safely ─── */}
      <div className="h-32" />

      {/* Upload Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-6">
          <form
            onSubmit={handleUpload}
            className="bg-white rounded-2xl p-8 w-full max-w-lg space-y-6"
          >
            <h2 className="text-5xl font-heading text-blue-600 text-center">
              Upload Photos
            </h2>

            <label className="block">
              <span className="text-4xl">Select Images</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="mt-3 w-full text-3xl rounded-md border-gray-300 p-2"
                onChange={e => {
                  if (!e.target.files) return
                  setFiles(Array.from(e.target.files))
                }}
              />
            </label>

            <label className="block">
              <span className="text-4xl">Date</span>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="mt-2 w-full text-3xl rounded-md border-gray-300 p-2"
              />
            </label>

            <label className="block">
              <span className="text-3xl">Place (City, Country)</span>
              <input
                type="text"
                required
                value={place}
                onChange={e => setPlace(e.target.value)}
                className="mt-2 w-full text-3xl rounded-md border-gray-300 p-2"
                placeholder="e.g. Oslo, Norway"
              />
            </label>

            <label className="block">
              <span className="text-3xl">Caption</span>
              <textarea
                required
                rows={2}
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="mt-2 w-full text-3xl rounded-md border-gray-300 p-2"
                placeholder="A brief caption…"
              />
            </label>

            <label className="block">
              <span className="text-4xl">Time (optional)</span>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="mt-2 w-full text-3xl rounded-md border-gray-300 p-2"
              />
            </label>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                className="px-6 py-2 text-3xl rounded border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded text-3xl hover:bg-blue-700 transition"
              >
                {saving ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && (() => {
        const idx = sortedPhotos.findIndex(p => p.id === previewOpen.id)
        return (
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-75 p-6"
            onClick={() => setPreviewOpen(null)}
          >
            <div
              className="relative bg-white rounded-2xl shadow-lg p-6
                         max-w-[90vw] max-h-[90vh] overflow-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Prev arrow */}
              {idx > 0 && (
                <button
                  onClick={() => setPreviewOpen(sortedPhotos[idx - 1])}
                  className="absolute left-1 top-1/2 -translate-y-1/2 text-[10rem] text-gray-400 hover:text-gray-600"
                  title="Previous photo"
                >
                  ‹
                </button>
              )}

              {/* Next arrow */}
              {idx < sortedPhotos.length - 1 && (
                <button
                  onClick={() => setPreviewOpen(sortedPhotos[idx + 1])}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-[10rem]  text-gray-400 hover:text-gray-600"
                  title="Next photo"
                >
                  ›
                </button>
              )}
          {/* big photo */}
          <img
            src={previewOpen.url}
            alt={previewOpen.caption}
            className="w-auto max-w-[90vw] h-auto max-h-[65vh] object-contain"
          />

          {/* ← CLOSE BUTTON */}
            <button
              onClick={() => setPreviewOpen(null)}
              className="absolute top-4 left-4 bg-white rounded-full p-2 shadow text-5xl leading-none focus:outline-none"
              title="Close"
            >
              ×
            </button>

          {/* caption / date / place */}
          <div className="mt-6 space-y-2 text-left">
            <div className="text-lg text-gray-600">
              {format(new Date(previewOpen.date), 'PPP')}
            </div>
            <div className="text-lg text-gray-600">
              {previewOpen.place}
            </div>
            <div className="text-2xl font-semibold text-gray-800">
              {previewOpen.caption}
            </div>
          </div>

          {/* edit / delete */}
          <div className="absolute top-4 right-4 flex space-x-3">
            <button
              onClick={() => {
                setEditOpen(previewOpen)
                setECaption(previewOpen.caption)
                setEDate(previewOpen.date)
                setEPlace(previewOpen.place)
                setETime(previewOpen.time || '')
                setPreviewOpen(null)
              }}
              className="bg-white rounded-full p-5 shadow hover:bg-blue-50 text-2xl"
              title="Edit"
              >
              <Edit2 className="w-10 h-10 text-blue-600" />
            </button>
            <button
              onClick={() => {
                handleDelete(previewOpen)
                setPreviewOpen(null)
              }}
              className="bg-white rounded-full p-5 shadow hover:bg-blue-50 text-2xl"
              title="Delete"
            >
              <Trash2 className="w-10 h-10 text-red-600" />
            </button>
          </div>
            </div>
          </div>
        )
      })()}

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <form
            onSubmit={handleEdit}
            className="bg-white rounded-2xl p-8 w-full max-w-2xl space-y-6"
          >
            <h2 className="text-5xl font-heading text-blue-600 text-center">
              Edit Photo
            </h2>

            <label className="block">
              <span className="text-4xl">Date</span>
              <input
                type="date"
                required
                value={eDate}
                onChange={e => setEDate(e.target.value)}
                className="mt-2 w-full text-4xl rounded-md border-gray-300 p-2"
              />
            </label>

            <label className="block">
              <span className="text-4xl">Place</span>
              <input
                type="text"
                required
                value={ePlace}
                onChange={e => setEPlace(e.target.value)}
                className="mt-2 w-full text-4xl rounded-md border-gray-300 p-2"
              />
            </label>

            <label className="block">
              <span className="text-4xl">Caption</span>
              <textarea
                required
                rows={2}
                value={eCaption}
                onChange={e => setECaption(e.target.value)}
                className="mt-2 w-full text-4xl rounded-md border-gray-300 p-2"
              />
            </label>

            <label className="block">
              <span className="text-4xl">Time (optional)</span>
              <input
                type="time"
                value={eTime}
                onChange={e => setETime(e.target.value)}
                className="mt-2 w-full text-4xl rounded-md border-gray-300 p-2"
              />
            </label>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setEditOpen(null)}
                className="px-7 py-3 text-3xl rounded border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-7 py-3 bg-blue-600 text-white rounded text-3xl hover:bg-blue-700 transition"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {setTimeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-6"
          onClick={() => setSetTimeOpen(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-4xl mb-4">Set time</h3>
            <input
              type="time"
              value={quickTime}
              onChange={e => setQuickTime(e.target.value)}
              className="w-full text-3xl rounded-md border-gray-300 p-2"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-6 py-2 rounded border text-3xl"
                onClick={() => setSetTimeOpen(null)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 rounded bg-blue-600 text-white text-3xl hover:bg-blue-700"
                onClick={async () => {
                  if (!setTimeOpen) return
                  const ref = doc(firestore, 'photos', setTimeOpen.id)
                  const baseDate = setTimeOpen.date
                  const localTime = quickTime || '12:00'
                  const takenAt = baseDate
                    ? new Date(`${baseDate}T${localTime}:00`).toISOString()
                    : null
                  await updateDoc(ref, {
                    time: quickTime || null,
                    takenAt,
                    updatedAt: serverTimestamp(),
                  })
                  setSetTimeOpen(null)
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}
