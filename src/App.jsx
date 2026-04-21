import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import supabase from './lib/supabase'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import HabitListPage from './pages/HabitListPage'
import HabitDetailPage from './pages/HabitDetailPage'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return <div className="text-center py-20">Loading...</div>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/register" element={session ? <Navigate to="/" /> : <RegisterPage />} />
        <Route path="/" element={session ? <DashboardPage session={session} /> : <Navigate to="/login" />} />
        <Route path="/habits" element={session ? <HabitListPage session={session} /> : <Navigate to="/login" />} />
        <Route path="/habits/:id" element={session ? <HabitDetailPage session={session} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
