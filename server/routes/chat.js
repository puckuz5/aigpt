const express = require('express')
const Groq    = require('groq-sdk')
const User    = require('../models/User')
const auth    = require('../middleware/auth')

const router = express.Router()
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY })

const Chat = require('../models/chat')

router.post('/', auth, async (req, res) => {
  try {
    const { message, chatId } = req.body

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' })
    }

    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.credits < 1) {
      return res.status(402).json({ message: 'Not enough credits.', credits: user.credits })
    }

    // Call Groq
    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: message }],
      max_tokens: 1024
    })
    const reply = result.choices[0].message.content

    // Deduct credit
    user.credits -= 1
    await user.save()

    // Save to MongoDB
    let chat
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, user: req.userId })
    }

    if (!chat) {
      chat = new Chat({
        user: req.userId,
        title: message.slice(0, 40),
        messages: []
      })
    }

    chat.messages.push({ role: 'user', content: message })
    chat.messages.push({ role: 'assistant', content: reply })
    await chat.save()

    res.json({ reply, creditsRemaining: user.credits, chatId: chat._id })

  } catch (error) {
    console.error('Chat error:', error.message)
    res.status(500).json({ message: 'Failed to generate response. Please try again.' })
  }
})

// Get all chats for current user
router.get('/history', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.userId })
      .select('title createdAt messages')
      .sort({ createdAt: -1 })
    res.json({ chats })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history' })
  }
})

// Get single chat
router.get('/history/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.chatId, user: req.userId })
    if (!chat) return res.status(404).json({ message: 'Chat not found' })
    res.json({ chat })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chat' })
  }
})
module.exports = router
