import React, { useState } from 'react'

const contactInfo = [
  {
    icon: '📧',
    label: 'Email',
    value: 'support@siddhaorganics.com',
    href: 'mailto:support@siddhaorganics.com',
    bg: '#EFF6FF',
    border: '#93C5FD',
  },
  {
    icon: '📞',
    label: 'Phone',
    value: '+91 98765 43210',
    href: 'tel:+919876543210',
    bg: '#F0FDF4',
    border: '#86EFAC',
  },
  {
    icon: '📍',
    label: 'Address',
    value: 'Hyderabad, Telangana, India',
    href: null,
    bg: '#FFF7ED',
    border: '#FCD34D',
  },
]

const businessHours = [
  { day: 'Monday – Friday', hours: '9:00 AM – 6:00 PM' },
  { day: 'Saturday', hours: '10:00 AM – 4:00 PM' },
  { day: 'Sunday', hours: 'Closed' },
]

const socialLinks = [
  { icon: '📸', label: 'Instagram', handle: '@siddhaorganics', href: 'https://instagram.com' },
  { icon: '👍', label: 'Facebook', handle: 'Siddha Organics', href: 'https://facebook.com' },
  { icon: '💬', label: 'WhatsApp', handle: '+91 98765 43210', href: 'https://wa.me/919876543210' },
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Full name is required.'
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters.'
    else if (form.name.trim().length > 100) errs.name = 'Name must be 100 characters or fewer.'

    if (!form.email.trim()) errs.email = 'Email address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email address.'

    if (!form.subject.trim()) errs.subject = 'Subject is required.'
    else if (form.subject.trim().length < 3) errs.subject = 'Subject must be at least 3 characters.'
    else if (form.subject.trim().length > 200) errs.subject = 'Subject must be 200 characters or fewer.'

    if (!form.message.trim()) errs.message = 'Message is required.'
    else if (form.message.trim().length < 10) errs.message = 'Message must be at least 10 characters.'
    else if (form.message.trim().length > 2000) errs.message = 'Message must be 2000 characters or fewer.'

    return errs
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setSubmitted(true)
  }

  const handleReset = () => {
    setForm({ name: '', email: '', subject: '', message: '' })
    setErrors({})
    setSubmitted(false)
  }

  const inputClass = (field) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green/40 focus:border-green transition-colors ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`

  return (
    <div className="min-h-screen">

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-20 px-4 flex items-center justify-center text-center"
        style={{ background: 'linear-gradient(135deg, #2D5016 0%, #4A7C2F 60%, #8B4513 100%)' }}
      >
        <div className="absolute top-8 left-8 w-40 h-40 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #F5F0E8, transparent)' }} />
        <div className="absolute bottom-8 right-8 w-56 h-56 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #F5F0E8, transparent)' }} />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-cream text-xs font-semibold tracking-widest uppercase">Get in Touch</span>
          </div>
          <h1 className="font-serif text-5xl font-bold text-cream mb-4">Contact Us</h1>
          <p className="text-cream/80 text-lg">
            Have a question or feedback? We'd love to hear from you. Our team typically responds within 24 hours.
          </p>
        </div>
      </section>

      {/* ── CONTACT INFO ─────────────────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(135deg, #F5F0E8 0%, #EDE5D0 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {contactInfo.map(({ icon, label, value, href, bg, border }) => (
              <div
                key={label}
                className="flex flex-col items-center text-center p-6 rounded-2xl border-2 hover:shadow-md transition-shadow"
                style={{ background: bg, borderColor: border }}
              >
                <span className="text-4xl mb-3">{icon}</span>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                {href ? (
                  <a href={href} className="font-semibold text-green hover:text-green-dark transition-colors">
                    {value}
                  </a>
                ) : (
                  <p className="font-semibold text-green">{value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT FORM + SIDE INFO ──────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-12">

          {/* Form — 3 cols */}
          <div className="md:col-span-3">
            <h2 className="font-serif text-3xl font-bold text-green mb-2">Send Us a Message</h2>
            <p className="text-gray-500 mb-8">Fill in the form below and we'll get back to you as soon as possible.</p>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border-2 border-green/30 bg-green/5">
                <span className="text-6xl mb-4">✅</span>
                <h3 className="font-bold text-green text-2xl mb-2">Message Sent!</h3>
                <p className="text-gray-500 mb-6">Thank you for reaching out. We'll respond within 24 hours.</p>
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-xl font-semibold text-cream transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      maxLength={100}
                      className={inputClass('name')}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      maxLength={254}
                      className={inputClass('email')}
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="What is this about?"
                    maxLength={200}
                    className={inputClass('subject')}
                  />
                  {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help… (min 10 characters)"
                    maxLength={2000}
                    className={`${inputClass('message')} resize-none`}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.message
                      ? <p className="text-xs text-red-500">{errors.message}</p>
                      : <span />}
                    <p className="text-xs text-gray-400">{form.message.length}/2000</p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="self-start px-8 py-3 rounded-xl font-bold text-cream shadow-lg hover:scale-105 transition-all"
                  style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}
                >
                  Send Message →
                </button>
              </form>
            )}
          </div>

          {/* Side info — 2 cols */}
          <div className="md:col-span-2 flex flex-col gap-8">

            {/* Business hours */}
            <div className="rounded-2xl p-6 border-2" style={{ background: '#FAFDF7', borderColor: '#86EFAC' }}>
              <h3 className="font-bold text-green text-lg mb-4 flex items-center gap-2">
                <span>🕐</span> Business Hours
              </h3>
              <ul className="flex flex-col gap-3">
                {businessHours.map(({ day, hours }) => (
                  <li key={day} className="flex justify-between text-sm">
                    <span className="text-gray-600">{day}</span>
                    <span className={`font-semibold ${hours === 'Closed' ? 'text-red-500' : 'text-green'}`}>
                      {hours}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social media */}
            <div className="rounded-2xl p-6 border-2" style={{ background: '#FFF7ED', borderColor: '#FCD34D' }}>
              <h3 className="font-bold text-green text-lg mb-4 flex items-center gap-2">
                <span>🌐</span> Follow Us
              </h3>
              <ul className="flex flex-col gap-3">
                {socialLinks.map(({ icon, label, handle, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:text-green transition-colors group"
                    >
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <p className="font-semibold text-green group-hover:underline">{label}</p>
                        <p className="text-gray-500 text-xs">{handle}</p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

    </div>
  )
}
