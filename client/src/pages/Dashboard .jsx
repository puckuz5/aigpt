import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { sendMessage } from '../services/api'
import api from '../services/api'

export default function Dashboard() {
  const { user, logout }            = useAuth()
  const [chats, setChats]           = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [messages, setMessages]     = useState([
    { role: 'assistant', content: 'Hi! I am AIGPT powered by LLaMA 3. Ask me anything!' }
  ])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [credits, setCredits]       = useState(user?.credits ?? 0)
  const [error, setError]           = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const bottomRef                   = useRef(null)

  // Auto scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load chat history on mount
  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const res = await api.get('/chat/history')
      setChats(res.data.chats || [])
    } catch (err) {
      console.error('Failed to load history')
    }
  }

  const loadChat = async (chatId) => {
    try {
      const res = await api.get(`/chat/history/${chatId}`)
      const chat = res.data.chat
      setActiveChatId(chatId)
      setMessages(chat.messages)
    } catch (err) {
      console.error('Failed to load chat')
    }
  }

  const startNewChat = () => {
    setActiveChatId(null)
    setMessages([{ role: 'assistant', content: 'Hi! I am AIGPT powered by LLaMA 3. Ask me anything!' }])
    setError('')
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    if (credits < 1) { setError('Not enough credits!'); return }

    const userMessage = input.trim()
    setInput('')
    setError('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const data = await api.post('/chat', {
        message: userMessage,
        chatId: activeChatId
      })

      setMessages(prev => [...prev, { role: 'assistant', content: data.data.reply }])
      setCredits(data.data.creditsRemaining)

      // Update chatId and refresh history
      if (!activeChatId) {
        setActiveChatId(data.data.chatId)
      }
      loadHistory()

    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong.'
      setMessages(prev => [...prev, { role: 'error', content: msg }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Navbar */}
      <nav className="border-b border-gray-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white transition p-1"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <span className="font-semibold text-white text-sm">AIGPT</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 rounded-full px-3 py-1">
            <span className="text-yellow-400 text-xs">⚡</span>
            <span className="text-xs font-medium">{credits} credits</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center">
            <span className="text-xs font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <span className="text-sm text-gray-300 hidden sm:block">{user?.name}</span>
          <button onClick={logout} className="text-xs text-gray-400 hover:text-white transition">
            Sign out
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">

            {/* New chat button */}
            <div className="p-3">
              <button
                onClick={startNewChat}
                className="w-full flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
              >
                <span>+</span> New Chat
              </button>
            </div>

            {/* Chat history list */}
            <div className="flex-1 overflow-y-auto px-2 pb-3">
              {chats.length === 0 ? (
                <p className="text-gray-500 text-xs text-center mt-4">No conversations yet</p>
              ) : (
                <>
                  <p className="text-gray-500 text-xs px-2 mb-2 uppercase tracking-wider">Recent</p>
                  {chats.map(chat => (
                    <button
                      key={chat._id}
                      onClick={() => loadChat(chat._id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition mb-1 truncate ${
                        activeChatId === chat._id
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      💬 {chat.title || 'New Chat'}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <span className="text-xs">AI</span>
                  </div>
                )}
                <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white rounded-br-md'
                    : msg.role === 'error'
                    ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                    : 'bg-gray-800 text-gray-100 rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-xs">AI</span>
                </div>
                <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{animationDelay:'0ms'}}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{animationDelay:'150ms'}}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{animationDelay:'300ms'}}></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="px-6 py-2 text-red-400 text-sm bg-red-500/5 border-t border-red-500/20">
              {error}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-800 p-4 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={credits < 1 ? 'No credits remaining' : 'Ask anything... (Enter to send)'}
              disabled={loading || credits < 1}
              className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || credits < 1}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg text-sm font-medium transition"
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
