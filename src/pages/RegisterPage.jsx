import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import supabase from '../lib/supabase'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      if (error.message.includes('User already registered')) {
        setError('An account with this email already exists.')
      } else if (error.message.includes('Signups not allowed')) {
        setError('Sign up is currently disabled.')
      } else {
        setError(error.message)
      }
      return
    }
    navigate('/login')
  }

  return (
    <div className="max-w-sm mx-auto mt-20 px-4">
      <h1 className="text-2xl font-bold mb-6">Habit Tracker — Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border rounded px-3 py-2 w-full"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border rounded px-3 py-2 w-full"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="mt-4 text-sm">
        Have an account? <Link to="/login" className="text-blue-600 underline">Login</Link>
      </p>
    </div>
  )
}
