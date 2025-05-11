// src/pages/NotesPage.tsx
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { firestore } from '../lib/firebase'
import { User } from 'lucide-react'
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
  createdAt: Date
}

export default function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])

  // modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
              createdAt: data.createdAt?.toDate() ?? new Date(),
            }
          }
        )
        setNotes(loaded)
      }
    )
    return () => unsub()
  }, [])

  // Open modal for new note or editing
  function openModal(note?: Note) {
    if (note) {
      setEditingId(note.id)
      setNewContent(note.content)
    } else {
      setEditingId(null)
      setNewContent('')
    }
    setModalOpen(true)
  }

  // Save or update
  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!newContent.trim() || !user) return
    setSaving(true)
    try {
      if (editingId) {
        const ref = doc(firestore, 'notes', editingId)
        await updateDoc(ref, { content: newContent.trim() })
      } else {
        await addDoc(collection(firestore, 'notes'), {
          content: newContent.trim(),
          author: user.displayName || user.email,
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

  // Delete with confirmation
  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this note? This cannot be undone.')) {
      return
    }
    await deleteDoc(doc(firestore, 'notes', id))
  }

  return (
    <div className="p-4 bg-pink-50 min-h-screen">
      <div className="space-y-4">
        {notes.map((note, i) => (
          <div
            key={note.id}
            className={`bg-white rounded-2xl shadow-md p-4 ${
              i === 0 ? 'sticky top-4 z-10 mb-4' : ''
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              {/* Author */}
              <div className="flex items-center space-x-2">
                <User className="w-11 h-11 text-pink-600" />
                <span className="font-medium text-gray-800 text-lg md:text-xl">{note.author}</span>
              </div>
              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => openModal(note)}
                  className="p-3 text-gray-500 hover:text-pink-600"
                  title="Edit note"
                >
                  <Edit2 className="w-10 h-10" />
                </button>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="p-3 text-gray-500 hover:text-red-600"
                  title="Delete note"
                >
                  <Trash2 className="w-10 h-10" />
                </button>
              </div>
            </div>
            {/* Content */}
            <p className="mt-4 text-lg md:text-2xl text-gray-700 whitespace-pre-wrap">
              {note.content}
            </p>
            {/* Footer with date */}
            <div className="mt-4 text-md text-gray-500">
              {note.createdAt.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* + button */}
      <button
        onClick={() => setModalOpen(true)}
        className="fixed right-6 bg-pink-600 text-white rounded-full p-4 shadow-lg hover:bg-pink-700 transition"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 8rem)' }}
      >
        <Plus className="w-16 h-16" />
      </button>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-50">
          <form
            onSubmit={handleSave}
            className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md space-y-4"
          >
            <h3 className="text-2xl font-heading text-pink-600 text-center">
              {editingId ? 'Edit Note' : 'New Note'}
            </h3>
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              rows={5}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Write your note here..."
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 rounded-md"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition"
              >
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
