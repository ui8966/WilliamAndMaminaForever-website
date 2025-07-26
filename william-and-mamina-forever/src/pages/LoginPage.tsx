import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate} from 'react-router-dom'
//import { Link } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState<string| null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, pw)
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
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-blue-100 to-white flex flex-col items-center justify-center text-center p-4 font-body">
      <form 
        onSubmit={handleSubmit} 
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-3xl font-heading text-pink-600 text-center">
          Welcome back
        </h2>

        {error && <p className="text-red-500 text-sm">{error}</p>}

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
          className="w-full bg-pink-600 text-white p-2 rounded-md hover:bg-pink-700 transition"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>

{/* commented out possibility to sign up */}
{/* 
        <p className="text-center text-sm">
          Need an account?{' '}
          <Link to="/register" className="text-pink-600 underline">
            Sign up
          </Link>
        </p>  */}
      </form>
    </div>
  )
}
