import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import supabase from '../lib/supabase'

const FREQUENCIES = ['daily', 'weekly']

export default function HabitListPage() {
  const navigate = useNavigate()
  const [habits, setHabits] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formName, setFormName] = useState('')
  const [formFrequency, setFormFrequency] = useState('daily')
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchHabits() }, [])

  async function fetchHabits() {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        if (
          error.message.includes('does not exist') ||
          error.message.includes('schema cache') ||
          error.message.includes('relation') ||
          error.message.includes('Could not find')
        ) {
          setError('Something went wrong. Please try again later.')
        } else {
          setError(error.message)
        }
        return
      }
      setHabits(data)
    } catch {
      setError('Connection error. Please check your internet and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setFormError(null)
    if (!formName.trim()) { setFormError('Habit name is required'); return }
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        name: formName.trim(),
        frequency: formFrequency || 'daily',
        is_archived: false
      })
      .select()
      .single()
    setSubmitting(false)
    if (error) { setFormError(error.message); return }
    setHabits(prev => [data, ...prev])
    setFormName('')
    setFormFrequency('daily')
  }

  async function handleArchive(id, current) {
    const { error } = await supabase
      .from('habits')
      .update({ is_archived: !current })
      .eq('id', id)
    if (error) { setError(error.message); return }
    setHabits(prev => prev.map(h => h.id === id ? { ...h, is_archived: !current } : h))
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (error) { setError(error.message); return }
    setHabits(prev => prev.filter(h => h.id !== id))
  }

  if (isLoading) return <div className="text-center py-8">Loading...</div>
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>

  return (
    <div className="max-w-lg mx-auto mt-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Habits</h1>
        <Link to="/" className="text-blue-600 underline text-sm">← Today</Link>
      </div>

      <form onSubmit={handleCreate} className="space-y-3 mb-8">
        <input
          type="text"
          placeholder="Habit name"
          value={formName}
          onChange={e => setFormName(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
        <select
          value={formFrequency}
          onChange={e => setFormFrequency(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        >
          {FREQUENCIES.map(f => (
            <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
          ))}
        </select>
        {formError && <p className="text-red-500 text-sm">{formError}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Habit'}
        </button>
      </form>

      {habits.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No habits yet. Create your first one above.
        </div>
      ) : (
        <ul className="space-y-2">
          {habits.map(h => (
            <li key={h.id} className={`flex justify-between items-center border rounded px-4 py-3 ${h.is_archived ? 'opacity-50' : ''}`}>
              <div>
                <Link to={`/habits/${h.id}`} className="font-medium text-blue-700 hover:underline">
                  {h.name}
                </Link>
                <p className="text-xs text-gray-400 capitalize">
                  {h.frequency}{h.is_archived ? ' — archived' : ''}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleArchive(h.id, h.is_archived)}
                  className="text-gray-500 text-sm hover:underline"
                >
                  {h.is_archived ? 'Unarchive' : 'Archive'}
                </button>
                <button
                  onClick={() => handleDelete(h.id)}
                  className="text-red-500 text-sm hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
