import React, { useState, useRef, useEffect, useCallback } from 'react'

// ─── Knowledge base ───────────────────────────────────────────────────────────

const FAQ_DATA = [
  { keywords: ['create account', 'sign up', 'register', 'new account', 'how to join'], answer: 'To create an account:\n1. Click "Login" in the top menu\n2. Click "Create one free"\n3. Fill in your name, email, phone, and password\n4. Click "Continue"\n5. Your account will be created and you can start shopping!' },
  { keywords: ['login', 'sign in', 'log in', 'cant login', 'forgot password'], answer: 'To login:\n1. Click "Login" in the top menu\n2. Enter your email and password\n3. Click "Sign In"\n\nForgot password? Click "Forgot password?" on the login page to reset it via email.' },
  { keywords: ['order', 'how to order', 'place order', 'buy', 'purchase'], answer: 'To place an order:\n1. Browse products in the Shop\n2. Click "Add to Cart"\n3. Click the cart icon (🛒)\n4. Click "Proceed to Checkout"\n5. Enter shipping address → Pay → Done!' },
  { keywords: ['payment', 'pay', 'upi', 'card', 'cod', 'cash on delivery', 'online'], answer: 'We accept:\n• UPI (GPay, PhonePe, Paytm)\n• Credit/Debit Cards\n• Net Banking\n• Cash on Delivery (COD)\n\nPayments are processed securely via Razorpay.' },
  { keywords: ['shipping', 'delivery', 'deliver', 'how long', 'when will'], answer: 'Shipping info:\n• Orders dispatched within 24 hours\n• Delivery in 3-5 business days\n• Free shipping on orders above ₹3,499\n• ₹50 shipping for orders below ₹3,499' },
  { keywords: ['return', 'refund', 'exchange', 'cancel', 'wrong product'], answer: 'Return Policy:\n• 7-day hassle-free returns\n• Contact us with photos of damaged/defective product\n• Full refund within 5-7 days\n• Email: siddhaorganicshyd@gmail.com' },
  { keywords: ['track', 'order status', 'where is my order', 'tracking'], answer: 'To track your order:\n1. Login to your account\n2. Go to Account → My Orders\n3. Click on your order to see the status timeline\n\nYou\'ll get email updates when your order ships and delivers.' },
  { keywords: ['products', 'what do you sell', 'organic', 'honey', 'ghee'], answer: 'We sell 100% organic products:\n🍯 Raw Honey (Tulsi, Wild Forest)\n🧈 A2 Gir Cow Ghee\n🌾 Jaggery Powder\n\nAll farm-fresh, unprocessed, chemical-free!' },
  { keywords: ['contact', 'support', 'help', 'phone', 'email', 'reach'], answer: 'Contact us:\n📧 siddhaorganicshyd@gmail.com\n📞 +91 98765 43210\n🌐 www.siddhaorganics.org\n\nOr visit our Contact page.' },
  { keywords: ['price', 'cost', 'discount', 'coupon', 'offer'], answer: 'We offer:\n• Seasonal discounts\n• Coupon codes at checkout\n• Free shipping on ₹3,499+\n\nCheck our Shop page for current prices!' },
  { keywords: ['safe', 'secure', 'trust', 'genuine', 'authentic'], answer: '🔒 Secure payments via Razorpay\n✅ 100% authentic organic\n📋 Lab-tested for purity\n🏆 Award-winning quality\n🔄 Easy returns' },
]

function getResponse(message) {
  const lower = message.toLowerCase()
  for (const faq of FAQ_DATA) {
    if (faq.keywords.some(k => lower.includes(k))) return faq.answer
  }
  return "I can help with:\n• Creating an account\n• Placing orders\n• Payment methods\n• Shipping & delivery\n• Returns & refunds\n• Tracking orders\n• Contact support\n\nTry asking about any of these!"
}

const SUGGESTIONS = ['How to create account?', 'How to place order?', 'Payment methods?', 'Shipping info', 'Track my order', 'Contact support']

const LOGO_URL = 'https://www.image2url.com/r2/default/images/1780742274635-913a5ef0-80b3-40fa-927c-6b28ce2dc610.png'

// ─── ChatBot Component (Draggable) ───────────────────────────────────────────

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([{ role: 'bot', text: 'Hi! 👋 I\'m Siddha Bot. How can I help you today?' }])
  const [input, setInput] = useState('')
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 })
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hasMoved, setHasMoved] = useState(false)
  const messagesEndRef = useRef(null)
  const btnRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Drag handlers
  const handlePointerDown = useCallback((e) => {
    setDragging(true)
    setHasMoved(false)
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y })
    e.target.setPointerCapture(e.pointerId)
  }, [position])

  const handlePointerMove = useCallback((e) => {
    if (!dragging) return
    setHasMoved(true)
    const newX = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragOffset.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.y))
    setPosition({ x: newX, y: newY })
  }, [dragging, dragOffset])

  const handlePointerUp = useCallback(() => {
    setDragging(false)
    if (!hasMoved) {
      setIsOpen(prev => !prev)
    }
  }, [hasMoved])

  const handleSend = (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setInput('')
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', text: getResponse(msg) }])
    }, 500)
  }

  return (
    <>
      {/* Draggable chat button */}
      <div
        ref={btnRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="fixed z-50 w-14 h-14 rounded-full shadow-xl cursor-grab active:cursor-grabbing select-none overflow-hidden border-2 border-green/30"
        style={{
          left: position.x,
          top: position.y,
          touchAction: 'none',
          background: '#fff',
        }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <div className="w-full h-full flex items-center justify-center bg-green text-white text-xl font-bold">✕</div>
        ) : (
          <img src={LOGO_URL} alt="Siddha Bot" className="w-full h-full object-contain p-1" />
        )}
      </div>

      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed z-50 w-80 sm:w-96 max-h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{
            left: Math.min(position.x, window.innerWidth - 400),
            top: Math.max(20, position.y - 520),
            animation: 'slideUp 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}>
            <img src={LOGO_URL} alt="Siddha Bot" className="w-9 h-9 rounded-full bg-white/20 object-contain p-0.5" />
            <div>
              <p className="text-white font-bold text-sm">Siddha Bot</p>
              <p className="text-white/70 text-xs">Ask me anything!</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="ml-auto text-white/70 hover:text-white text-lg">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${msg.role === 'user' ? 'bg-green text-white rounded-br-sm' : 'bg-gray-100 text-gray-700 rounded-bl-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => handleSend(s)} className="text-xs bg-green/10 text-green px-3 py-1.5 rounded-full hover:bg-green/20 transition-colors">{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message…"
              className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
            />
            <button onClick={() => handleSend()} disabled={!input.trim()} className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}>➤</button>
          </div>
        </div>
      )}

      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </>
  )
}
