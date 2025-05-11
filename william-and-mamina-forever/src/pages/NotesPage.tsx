import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { firestore } from '../lib/firebase'
import { User as UserIcon } from 'lucide-react'
import type { QuerySnapshot, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'
import { Plus, Edit2, Trash2 } from 'lucide-react'

interface Note {
  id: string
  content: string
  author: string
  authorPhoto?: string
  createdAt: Date
}

export default function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])

  // Note editor modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Photo preview modal state
  const [photoModalSrc, setPhotoModalSrc] = useState<string | null>(null)

  // Subscribe to notes collection
  useEffect(() => {
    const notesQuery = query(
      collection(firestore, 'notes'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(
      notesQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const loaded = snapshot.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) => {
            const data = d.data()
            return {
              id: d.id,
              content: data.content,
              author: data.author,
              authorPhoto: data.authorPhoto ?? null,
              createdAt: data.createdAt?.toDate() ?? new Date(),
            }
          }
        )
        setNotes(loaded)
      }
    )
    return () => unsub()
  }, [])

  // Open editor modal
  function openEditor(note?: Note) {
    if (note) {
      setEditingId(note.id)
      setNewContent(note.content)
    } else {
      setEditingId(null)
      setNewContent('')
    }
    setModalOpen(true)
  }

  // Save or update note
  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!newContent.trim() || !user) return
    setSaving(true)
    try {
      if (editingId) {
        await updateDoc(doc(firestore, 'notes', editingId), {
          content: newContent.trim(),
          authorPhoto: user.photoURL || null,
        })
      } else {
        await addDoc(collection(firestore, 'notes'), {
          content: newContent.trim(),
          author:  user.displayName || user.email!,
          authorPhoto: user.photoURL || null,
          createdAt: serverTimestamp(),
        })
      }
      setNewContent('')
      setEditingId(null)
      setModalOpen(false)
    } catch (err) {
      console.error('Failed to save note', err)
    } finally {
      setSaving(false)
    }
  }

  // Delete note
  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this note? This cannot be undone.')) {
      return
    }
    await deleteDoc(doc(firestore, 'notes', id))
  }

return (
    <div className="p-4 bg-pink-50 min-h-screen">
      <div className="space-y-6">  {/* more breathing room */}
        {notes.map((note, i) => (
          <div
            key={note.id}
            className={`bg-white rounded-2xl shadow-md p-6 ${i === 0 ? 'sticky top-6 z-10 mb-6' : ''}`}
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              {/* Author avatar & name */}
              <div className="flex items-center space-x-4">
                {note.authorPhoto ? (
                  <img
                    src={note.authorPhoto}
                    alt={note.author}
                    className="w-20 h-20 rounded-full object-cover border-2 cursor-pointer"
                    onClick={() => setPhotoModalSrc(note.authorPhoto!)}
                  />
                ) : (
                  <UserIcon className="w-20 h-20 text-pink-600" />
                )}
                <span className="font-semibold text-gray-800 text-2xl md:text-4xl">
                  {note.author}
                </span>
              </div>

              {/* Edit/Delete */}
              <div className="flex space-x-4">
                <button
                  onClick={() => openEditor(note)}
                  className="p-3 text-gray-500 hover:text-pink-600"
                  title="Edit note"
                >
                  <Edit2 className="w-12 h-12" />
                </button>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="p-3 text-gray-500 hover:text-red-600"
                  title="Delete note"
                >
                  <Trash2 className="w-12 h-12" />
                </button>
              </div>
            </div>

            {/* Content */}
            <p className="mt-6 text-xl md:text-4xl text-gray-700 whitespace-pre-wrap">
              {note.content}
            </p>

            {/* Footer date */}
            <div className="mt-6 text-lg md:text-2xl text-gray-500">
              {note.createdAt.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* + New Note button */}
      <button
        onClick={() => openEditor()}
        className="fixed right-6 bg-pink-600 text-white rounded-full p-4 shadow-lg hover:bg-pink-700 transition"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 9rem)' }}
      >
        <Plus className="w-20 h-20" />
      </button>

      {/* Note Editor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-50 p-6">
          <form
            onSubmit={handleSave}
            className="bg-white p-9 rounded-2xl shadow-lg w-full max-w-7xl space-y-10"
          >
            <h3 className="text-6xl font-heading text-pink-600 text-center">
              {editingId ? 'Edit Note' : 'New Note'}
            </h3>
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              rows={10}
              className="w-full border border-gray-300 rounded-md p-5 text-5xl"
              placeholder="Write your note here..."
            />
            <div className="flex justify-between">
              <button
                type="button"
                className="px-10 py-3 text-2xl rounded-md border "
                onClick={() => setModalOpen(false)}
              >Cancel</button>
              <button
                type="submit"
                disabled={saving}
                className="px-10 py-3 text-2xl bg-pink-600 text-white rounded-md hover:bg-pink-700 transition"
              >{saving ? 'Saving…' : editingId ? 'Save Changes' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Photo Preview Modal */}
      {photoModalSrc && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setPhotoModalSrc(null)}
        >
          <img
            src={photoModalSrc}
            alt="Author"
            className="max-w-md max-h-[80vh] rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  )
}
