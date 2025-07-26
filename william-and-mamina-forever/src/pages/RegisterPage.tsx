import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RegisterPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState<string| null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signup(email, pw, firstName)
      navigate('/')      // go home on success
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unknown error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-200 via-blue-100 p-4">
      <form 
        onSubmit={handleSubmit} 
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-3xl font-heading text-blue-600 text-center">
          Create an account
        </h2>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* First Name */}
        <label className="block">
          <span className="text-gray-700">First Name</span>
          <input
            type="text"
            required
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-2"
          />
        </label>

        <label className="block">
          <span className="text-gray-700">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-2"
          />
        </label>

        <label className="block">
          <span className="text-gray-700">Password</span>
          <input
            type="password"
            required
            value={pw}
            onChange={e => setPw(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 p-2"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
        >
          {loading ? 'Creating…' : 'Sign up'}
        </button>

        <p className="text-center text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}
