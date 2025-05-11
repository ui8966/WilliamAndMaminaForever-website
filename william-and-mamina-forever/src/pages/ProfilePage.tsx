// src/pages/ProfilePage.tsx
import { useState, useEffect, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { auth, storage } from '../lib/firebase'
import { updateProfile } from 'firebase/auth'
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage'
import { useNavigate } from 'react-router-dom'
import { Camera } from 'lucide-react'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState(user?.displayName || '')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [preview, setPreview] = useState(user?.photoURL || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (photoFile) {
      const url = URL.createObjectURL(photoFile)
      setPreview(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [photoFile])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      let photoURL = user.photoURL

      if (photoFile) {
        const ref = storageRef(storage, `avatars/${user.uid}`)
        const uploadTask = uploadBytesResumable(ref, photoFile)
        await new Promise((res, rej) => {
          uploadTask.on('state_changed', null, rej, () => res(undefined))
        })
        photoURL = await getDownloadURL(ref)
      }

      await updateProfile(auth.currentUser!, {
        displayName: firstName,
        photoURL,
      })
      navigate('/') // back home
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col items-center p-7 space-y-9">
      <h2 className="text-7xl font-heading text-pink-600">Your Profile</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-4xl space-y-8"
      >
        {/* Photo picker */}
        <div className="flex flex-col items-center">
          <div className="w-60 h-60 rounded-full overflow-hidden bg-gray-100">
            {preview ? (
              <img
                src={preview}
                alt="avatar preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-gray-400">
                <Camera className="w-18 h-18" />
              </div>
            )}
          </div>
          <label className="mt-5 cursor-pointer text-3xl text-pink-600 underline">
            Change Photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e =>
                e.target.files && setPhotoFile(e.target.files[0])
              }
            />
          </label>
        </div>

        {/* First name */}
        <label className="block">
          <span className="text-3xl text-gray-700">First Name</span>
          <input
            type="text"
            required
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className="mt-2 w-full rounded-md border-gray-300 p-4 text-3xl"
          />
        </label>

        {/* Actions */}
        <div className="flex justify-between items-center mt-4">
          <button
            type="button"
            onClick={() => logout().then(() => navigate('/login'))}
            className="text-3xl text-red-500"
          >
            Log out
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-pink-600 text-white px-7 py-4 text-3xl rounded-md hover:bg-pink-700 transition"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
