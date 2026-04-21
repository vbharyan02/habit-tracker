import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'

export default function HabitDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [habit, setHabit] = useState(null)
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { fetchData() }, [id])

  async function fetchData() {
    setIsLoading(true)
    setError(null)
    try {
      const [habitRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('id', id).single(),
        supabase.from('habit_logs').select('id, logged_date, note').eq('habit_id', id).order('logged_date', { ascending: false })
      ])
      if (habitRes.error) {
        if (
          habitRes.error.message.includes('does not exist') ||
          habitRes.error.message.includes('schema cache') ||
          habitRes.error.message.includes('relation') ||
          habitRes.error.message.includes('Could not find')
        ) {
          setError('Something went wrong. Please try again later.')
        } else {
          setError(habitRes.error.message)
        }
        return
      }
      if (logsRes.error) { setError(logsRes.error.message); return }
      setHabit(habitRes.data)
      setLogs(logsRes.data)
    } catch {
      setError('Connection error. Please check your internet and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function calcStreak(logs) {
    if (!logs.length) return 0
    const sorted = [...logs].map(l => l.logged_date).sort().reverse()
    let streak = 0
    let cursor = new Date().toISOString().slice(0, 10)
    for (const d of sorted) {
      if (d === cursor) {
        streak++
        const dt = new Date(cursor)
        dt.setDate(dt.getDate() - 1)
        cursor = dt.toISOString().slice(0, 10)
      } else {
        break
      }
    }
    return streak
  }

  if (isLoading) return <div className="text-center py-8">Loading...</div>
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>

  const streak = calcStreak(logs)

  return (
    <div className="max-w-lg mx-auto mt-10 px-4">
      <button onClick={() => navigate('/habits')} className="text-blue-600 underline text-sm mb-4 block">
        ← Back to Habits
      </button>
      <h1 className="text-2xl font-bold mb-1">{habit?.name}</h1>
      <p className="text-gray-500 text-sm mb-2 capitalize">{habit?.frequency}</p>
      <p className="text-sm mb-6">
        Current streak: <span className="font-bold">{streak} day{streak !== 1 ? 's' : ''}</span>
        {' '}· Total completions: <span className="font-bold">{logs.length}</span>
      </p>

      <h2 className="font-semibold mb-3">Completion History</h2>
      {logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No completions yet. Mark this habit done from the dashboard.
        </div>
      ) : (
        <ul className="space-y-1">
          {logs.map(log => (
            <li key={log.id} className="border rounded px-4 py-2 text-sm flex justify-between">
              <span>{log.logged_date}</span>
              {log.note && <span className="text-gray-400">{log.note}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
