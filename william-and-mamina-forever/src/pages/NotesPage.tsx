// src/pages/NotesPage.tsx
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { firestore } from '../lib/firebase'
import type { QuerySnapshot, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'
import { Plus } from 'lucide-react'

interface Note {
  id: string
  content: string
  author: string
  createdAt: Date
}

export default function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [saving, setSaving] = useState(false)

  // Subscribe to notes collection
  useEffect(() => {
    const notesQuery = query(
      collection(firestore, 'notes'),
      orderBy('createdAt', 'desc')
    )
  const unsub = onSnapshot(
    notesQuery,
    // ← annotate snapshot as QuerySnapshot<DocumentData>
    (snapshot: QuerySnapshot<DocumentData>) => {
      const loaded = snapshot.docs.map(
        // ← annotate each doc as QueryDocumentSnapshot<DocumentData>
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data()
          return {
            id: doc.id,
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

  // Save a new note
  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!newContent.trim() || !user) return
    setSaving(true)
    try {
      await addDoc(collection(firestore, 'notes'), {
        content: newContent.trim(),
        author: user.email,
        createdAt: serverTimestamp(),
      })
      setNewContent('')
      setModalOpen(false)
    } catch (err) {
      console.error('Failed to save note', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 bg-pink-50 min-h-screen">

      <div className="space-y-4">
        {notes.map(note => (
          <div
            key={note.id}
            className="bg-white rounded-2xl shadow-md p-4"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-800">{note.author}</span>
              <span className="text-sm text-gray-500">
                {note.createdAt.toLocaleString()}
              </span>
            </div>
            <p className="mt-2 text-gray-700 whitespace-pre-wrap">
              {note.content}
            </p>
          </div>
        ))}
      </div>

      {/* + button */}
      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-20 right-7 bg-pink-600 text-white rounded-full p-4 shadow-lg hover:bg-pink-700 transition"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <form
            onSubmit={handleSave}
            className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md space-y-4"
          >
            <h3 className="text-2xl font-heading text-pink-600 text-center">
              New Note
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
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
