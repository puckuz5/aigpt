const express  = require('express')
const cors     = require('cors')
const dotenv   = require('dotenv')
const connectDB = require('./config/db')

dotenv.config()

connectDB()

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))

app.use(express.json())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/chat', require('./routes/chat'))   // ← 

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AIGPT server is running',
    timestamp: new Date().toISOString()
  })
})

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` })
})

app.use((err, req, res, next) => {
  console.error('Server error:', err.message)
  res.status(500).json({ message: 'Internal server error' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})