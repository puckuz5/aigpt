/*
  ROUTES/AUTH.JS — Register and Login Endpoints
  ───────────────────────────────────────────────
  This file defines two API endpoints:

  POST /api/auth/register — create a new user
  POST /api/auth/login    — login and get a JWT token

  What is a JWT?
  ─────────────
  JWT = JSON Web Token. It's a string that looks like:
  eyJhbGci...eyJ1c2VySWQi...signature

  It contains encoded data (user ID, expiry) and a signature.
  When the user logs in, we give them a token.
  For protected routes, they send this token in the request header.
  We verify the signature to confirm it's valid and wasn't tampered with.
  No need to hit the database on every request to check if they're logged in.
*/

const express = require('express')
const jwt     = require('jsonwebtoken')
const User    = require('../models/User')

const router = express.Router()

/*
  HELPER: generateToken
  ─────────────────────
  Creates a JWT token for a user.
  jwt.sign(payload, secret, options):
  - payload: data to encode (we include userId)
  - secret: a secret string from .env used to sign the token
  - expiresIn: token expires after 7 days
*/
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

/*
  POST /api/auth/register
  ────────────────────────
  Body: { name, email, password }
  Returns: { user, token }

  Steps:
  1. Check if email already exists
  2. Create new user (password hashed automatically by pre-save hook)
  3. Generate JWT token
  4. Return user data + token
*/
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Validate all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' })
    }

    // Create user — password hashed automatically by the pre-save hook in User.js
    const user = await User.create({ name, email, password })

    // Generate token
    const token = generateToken(user._id)

    // Return response — never send the password back, even hashed
    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id:      user._id,
        name:    user.name,
        email:   user.email,
        credits: user.credits   // will be 20 (the default)
      }
    })

  } catch (error) {
    console.error('Register error details:', error)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message)
      return res.status(400).json({ message: messages.join(', ') })
    }
    res.status(500).json({ message: 'Server error during registration' })
  }
})
/*
  POST /api/auth/login
  ─────────────────────
  Body: { email, password }
  Returns: { user, token }

  Steps:
  1. Find user by email
  2. Compare entered password with hashed password in DB
  3. Generate JWT token
  4. Return user data + token
*/
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' })
    }

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      // Use a vague message — don't tell attackers whether the email exists
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Compare password using the method we defined in User.js
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Generate token
    const token = generateToken(user._id)

    res.json({
      message: 'Login successful',
      token,
      user: {
        id:      user._id,
        name:    user.name,
        email:   user.email,
        credits: user.credits
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login' })
  }
})

/*
  GET /api/auth/me
  ─────────────────
  Returns the currently logged-in user's data.
  Protected route — requires a valid JWT token.
  We'll use the auth middleware for this.
*/
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    // req.userId is set by the auth middleware
    const user = await User.findById(req.userId).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json({ user })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
