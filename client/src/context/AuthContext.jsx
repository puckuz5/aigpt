/*
  CONTEXT/AUTHCONTEXT.JSX — Global Auth State
  ──────────────────────────────────────────────
  What is React Context?
  ───────────────────────
  Context is React's way of sharing data across
  all components without passing props down manually.

  Problem without context:
  App → Navbar → UserAvatar (needs user data)
  You'd have to pass user as a prop through every
  component in between. This is called "prop drilling"
  and it's messy.

  With context:
  Any component can access user data directly
  by calling useAuth() — no prop passing needed.

  This file creates an AuthContext that stores:
  - user: the logged-in user object (or null)
  - loading: true while checking if user is logged in
  - login(): function to log in
  - logout(): function to log out
  - register(): function to register

  Any component that needs this just calls useAuth()
*/

import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, register as apiRegister, getMe } from '../services/api'

// Step 1: Create the context
const AuthContext = createContext(null)

/*
  Step 2: Create the Provider component
  ────────────────────────────────────────
  This wraps your entire app and makes the
  auth state available to all children.
  We put this in main.jsx around <App />.
*/
export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  /*
    On first load, check if user is already logged in.
    If there's a token in localStorage, fetch the user data.
    This keeps the user logged in after refreshing the page.
  */
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const data = await getMe()
          setUser(data.user)
        } catch {
          // Token is invalid or expired — clear it
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  /*
    login(email, password)
    ────────────────────────
    1. Calls the API login function
    2. Saves token to localStorage
    3. Updates user state
    4. Returns the user object
  */
  const login = async (email, password) => {
    const data = await apiLogin(email, password)
    localStorage.setItem('token', data.token)
    setUser(data.user)
    return data.user
  }

  /*
    register(name, email, password)
    ────────────────────────────────
    Same as login but calls register endpoint
  */
  const register = async (name, email, password) => {
    const data = await apiRegister(name, email, password)
    localStorage.setItem('token', data.token)
    setUser(data.user)
    return data.user
  }

  /*
    logout()
    ─────────
    Clears localStorage and sets user to null.
    The response interceptor in api.js also
    calls this if it gets a 401 response.
  */
  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  // The value object is what all components get access to
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isLoggedIn: !!user  // true if user exists, false if null
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/*
  Step 3: Create a custom hook
  ──────────────────────────────
  Instead of:
  import { useContext, AuthContext } from '...'
  const auth = useContext(AuthContext)

  Components just write:
  import { useAuth } from '../context/AuthContext'
  const { user, login, logout } = useAuth()
*/
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}

export default AuthContext
