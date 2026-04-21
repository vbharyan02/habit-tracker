import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import supabase from '../lib/supabase'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [habits, setHabits] = useState([])
  const [loggedIds, setLoggedIds] = useState({}) // habit_id -> log_id for today
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setIsLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('is_archived', false).order('created_at', { ascending: true }),
        supabase.from('habit_logs').select('id, habit_id').eq('logged_date', today).eq('user_id', user.id)
      ])

      if (habitsRes.error) {
        if (
          habitsRes.error.message.includes('does not exist') ||
          habitsRes.error.message.includes('schema cache') ||
          habitsRes.error.message.includes('relation') ||
          habitsRes.error.message.includes('Could not find')
        ) {
          setError('Something went wrong. Please try again later.')
        } else {
          setError(habitsRes.error.message)
        }
        return
      }
      if (logsRes.error) { setError(logsRes.error.message); return }

      setHabits(habitsRes.data)
      const map = {}
      for (const log of logsRes.data) map[log.habit_id] = log.id
      setLoggedIds(map)
    } catch {
      setError('Connection error. Please check your internet and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleToggle(habitId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (loggedIds[habitId]) {
      const { error } = await supabase.from('habit_logs').delete().eq('id', loggedIds[habitId])
      if (error) { setError(error.message); return }
      setLoggedIds(prev => { const n = { ...prev }; delete n[habitId]; return n })
    } else {
      const { data, error } = await supabase
        .from('habit_logs')
        .insert({ user_id: user.id, habit_id: habitId, logged_date: today })
        .select('id')
        .single()
      if (error) { setError(error.message); return }
      setLoggedIds(prev => ({ ...prev, [habitId]: data.id }))
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (isLoading) return <div className="text-center py-8">Loading...</div>
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>

  const doneCount = Object.keys(loggedIds).length
  const totalCount = habits.length

  return (
    <div className="max-w-lg mx-auto mt-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Today's Habits</h1>
        <div className="flex gap-3 items-center">
          <Link to="/habits" className="text-blue-600 underline text-sm">Manage Habits</Link>
          <button onClick={handleLogout} className="bg-gray-200 px-3 py-1 rounded text-sm">Logout</button>
        </div>
      </div>

      <p className="text-gray-500 text-sm mb-6">{today} — {doneCount}/{totalCount} done</p>

      {habits.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No habits yet. <Link to="/habits" className="text-blue-600 underline">Create your first one.</Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {habits.map(h => {
            const done = !!loggedIds[h.id]
            return (
              <li key={h.id} className="flex justify-between items-center border rounded px-4 py-3">
                <div>
                  <Link to={`/habits/${h.id}`} className="font-medium text-blue-700 hover:underline">
                    {h.name}
                  </Link>
                  <p className="text-xs text-gray-400 capitalize">{h.frequency}</p>
                </div>
                <button
                  onClick={() => handleToggle(h.id)}
                  className={`px-3 py-1 rounded text-sm font-medium ${done ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {done ? 'Done' : 'Mark Done'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
