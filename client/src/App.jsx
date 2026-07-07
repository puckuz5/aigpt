/*
  APP.JSX — Routing Setup
  ────────────────────────
  React Router lets you show different components
  for different URLs — like pages in a website.

  / (home)         → redirect to /dashboard or /login
  /login           → Login page
  /register        → Register page
  /dashboard       → Dashboard (protected — must be logged in)

  ProtectedRoute: if user is not logged in, redirect to /login
  PublicRoute: if user IS logged in, redirect to /dashboard
  (so logged-in users can't see the login page)
*/

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
 import Dashboard from './pages/Dashboard .jsx'
// const Dashboard = () => {
//   const { user, logout } = useAuth()
//   return (
//     <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
//       <div className="text-center">
//         <h1 className="text-2xl font-bold mb-4">Welcome, {user?.name}!</h1>
//         <p className="text-gray-400 mb-2">Credits: {user?.credits}</p>
//         <button onClick={logout} className="bg-violet-600 px-4 py-2 rounded-lg text-sm">
//           Sign out
//         </button>
//       </div>
//     </div>
//   )
// }
// Shows a loading spinner while checking auth status
const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
)

// Protected route — redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

// Public route — redirects to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return !isLoggedIn ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute><Register /></PublicRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
    </Routes>
  )
}
