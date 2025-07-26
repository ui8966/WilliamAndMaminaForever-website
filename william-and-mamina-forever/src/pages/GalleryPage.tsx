// src/pages/GalleryPage.tsx
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
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

  // edit form (populated from editOpen)
  const [eCaption, setECaption] = useState('')
  const [eDate, setEDate]       = useState('')
  const [ePlace, setEPlace]     = useState('')

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
        }
      })
      setPhotos(list)
    })
    return () => unsub()
  }, [])

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
        const url = await getDownloadURL(ref)
        await addDoc(collection(firestore, 'photos'), {
          url,
          path,
          caption,
          date,
          place,
          createdAt: serverTimestamp(),
        })
      }
      // reset form
      setFiles([])
      setCaption('')
      setDate('')
      setPlace('')
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
      const ref = doc(firestore, 'photos', editOpen.id)
      await updateDoc(ref, {
        caption: eCaption,
        date:    eDate,
        place:   ePlace,
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

   // --- grouping for the two new views ---
 const byDateGroups = photos
   .sort((a,b)=> a.date.localeCompare(b.date))
   .reduce<Record<string, Photo[]>>((acc,p)=>{
     (acc[p.date] ??= []).push(p)
     return acc
   }, {})

 const byPlaceGroups = photos
   .reduce<Record<string, Photo[]>>((acc, p) => {
     const city = p.place.split(',')[0];
     (acc[city] ??= []).push(p);
     return acc;
   }, {});

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
    {photos.map(p => (
      <div key={p.id} className="relative bg-white rounded-2xl shadow overflow-hidden">
        {/* Preview on click */}
        <button
          onClick={() => setPreviewOpen(p)}
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

{view==='map' && (
    <div className="p-4 text-gray-700">
        <p className="text-3xl font-bold text-center text-blue-600">
        I will add a map view here! 🌍
        </p>
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
        const idx = photos.findIndex(p => p.id === previewOpen.id)
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-6"
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
                  onClick={() => setPreviewOpen(photos[idx - 1])}
                  className="absolute left-1 top-1/2 -translate-y-1/2 text-[10rem] text-gray-400 hover:text-gray-600"
                  title="Previous photo"
                >
                  ‹
                </button>
              )}

              {/* Next arrow */}
              {idx < photos.length - 1 && (
                <button
                  onClick={() => setPreviewOpen(photos[idx + 1])}
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
    </div>
  )
}
