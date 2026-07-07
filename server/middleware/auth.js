/*
  MIDDLEWARE/AUTH.JS — JWT Verification Middleware
  ──────────────────────────────────────────────────
  What is middleware?
  ───────────────────
  In Express, middleware is a function that runs BETWEEN
  receiving a request and sending a response.

  Think of it as a security checkpoint. Before the actual
  route handler runs, this middleware:
  1. Reads the JWT token from the request header
  2. Verifies it's valid and hasn't expired
  3. Extracts the userId from the token
  4. Attaches userId to the request object
  5. Calls next() to pass control to the actual route handler

  If the token is missing or invalid, it stops here and
  sends a 401 Unauthorized response — the route handler
  never runs.

  Usage in routes:
  router.get('/protected', authMiddleware, (req, res) => {
    // req.userId is available here because middleware set it
    res.json({ userId: req.userId })
  })
*/

const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  try {
    // Token is sent in the Authorization header like:
    // Authorization: Bearer eyJhbGci...
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Please log in.' })
    }

    // Extract the token part after "Bearer "
    const token = authHeader.split(' ')[1]

    // Verify the token using our secret
    // jwt.verify() throws an error if:
    // - token is invalid (tampered with)
    // - token has expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attach userId to req so route handlers can use it
    req.userId = decoded.userId

    // Pass control to the next middleware or route handler
    next()

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' })
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Please log in again.' })
    }
    res.status(401).json({ message: 'Authentication failed.' })
  }
}

module.exports = authMiddleware
