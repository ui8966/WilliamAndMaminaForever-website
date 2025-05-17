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
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editOpen, setEditOpen]     = useState<Photo | null>(null)

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

  return (
    <div className="p-4 bg-pink-50 min-h-screen">
      {/* Upload button */}
      <button
        onClick={() => setUploadOpen(true)}
        className="fixed right-6 bg-pink-600 text-white rounded-full p-4 shadow-lg hover:bg-pink-700 transition"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 9rem)' }}
      >
        <Plus className="w-20 h-20" />
      </button>

      {/* Photo grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {photos.map(p => (
          <div key={p.id} className="relative bg-white rounded-2xl shadow-lg overflow-hidden">
            <img src={p.url} alt={p.caption}
                 className="w-full h-64 object-cover" />
            <div className="p-4 space-y-2">
              <div className="text-lg font-medium">{format(new Date(p.date), 'PPP')}</div>
              <div className="text-gray-600">{p.place}</div>
              <div className="text-gray-800 text-xl">{p.caption}</div>
            </div>
            <div className="absolute top-2 right-2 flex space-x-2">
              <button onClick={() => {
                setEditOpen(p)
                setECaption(p.caption)
                setEDate(p.date)
                setEPlace(p.place)
              }} className="bg-white p-2 rounded-full shadow hover:bg-pink-50">
                <Edit2 className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={() => handleDelete(p)} className="bg-white p-2 rounded-full shadow hover:bg-red-50">
                <Trash2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <form
            onSubmit={handleUpload}
            className="bg-white rounded-2xl p-8 w-full max-w-lg space-y-6"
          >
            <h2 className="text-3xl font-heading text-pink-600 text-center">
              Upload Photos
            </h2>

            <label className="block">
              <span className="text-lg">Select Images</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="mt-2"
                onChange={e => {
                  if (!e.target.files) return
                  setFiles(Array.from(e.target.files))
                }}
              />
            </label>

            <label className="block">
              <span className="text-lg">Date</span>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="mt-2 w-full rounded-md border-gray-300 p-2"
              />
            </label>

            <label className="block">
              <span className="text-lg">Place (City, Country)</span>
              <input
                type="text"
                required
                value={place}
                onChange={e => setPlace(e.target.value)}
                className="mt-2 w-full rounded-md border-gray-300 p-2"
                placeholder="e.g. Oslo, Norway"
              />
            </label>

            <label className="block">
              <span className="text-lg">Caption</span>
              <textarea
                required
                rows={2}
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="mt-2 w-full rounded-md border-gray-300 p-2"
                placeholder="A brief caption…"
              />
            </label>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                className="px-6 py-2 text-lg rounded border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-pink-600 text-white rounded text-lg hover:bg-pink-700 transition"
              >
                {saving ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <form
            onSubmit={handleEdit}
            className="bg-white rounded-2xl p-8 w-full max-w-lg space-y-6"
          >
            <h2 className="text-3xl font-heading text-pink-600 text-center">
              Edit Photo
            </h2>

            <label className="block">
              <span className="text-lg">Date</span>
              <input
                type="date"
                required
                value={eDate}
                onChange={e => setEDate(e.target.value)}
                className="mt-2 w-full rounded-md border-gray-300 p-2"
              />
            </label>

            <label className="block">
              <span className="text-lg">Place</span>
              <input
                type="text"
                required
                value={ePlace}
                onChange={e => setEPlace(e.target.value)}
                className="mt-2 w-full rounded-md border-gray-300 p-2"
              />
            </label>

            <label className="block">
              <span className="text-lg">Caption</span>
              <textarea
                required
                rows={2}
                value={eCaption}
                onChange={e => setECaption(e.target.value)}
                className="mt-2 w-full rounded-md border-gray-300 p-2"
              />
            </label>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setEditOpen(null)}
                className="px-6 py-2 text-lg rounded border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-pink-600 text-white rounded text-lg hover:bg-pink-700 transition"
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
