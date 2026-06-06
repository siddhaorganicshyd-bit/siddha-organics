import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '../../contexts/index.js'
import ProductCard from '../../components/product/ProductCard.jsx'
import { LoadingState } from '../../components/ui/Spinner.jsx'
import SiddhaLogo from '../../components/ui/SiddhaLogo.jsx'

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        let start = 0
        const step = Math.ceil(target / 60)
        const timer = setInterval(() => {
          start += step
          if (start >= target) { setCount(target); clearInterval(timer) }
          else setCount(start)
        }, 20)
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ─── Testimonials data ────────────────────────────────────────────────────────
const testimonials = [
  { name: 'Priya Sharma', city: 'Mumbai', text: 'The Tulsi Honey is absolutely divine! I can taste the difference from store-bought honey. My whole family loves it.', rating: 5, avatar: '👩' },
  { name: 'Rajesh Kumar', city: 'Bangalore', text: 'A2 Ghee is exactly what I was looking for. The aroma and taste remind me of my grandmother\'s kitchen. Highly recommended!', rating: 5, avatar: '👨' },
  { name: 'Anita Patel', city: 'Ahmedabad', text: 'Jaggery Powder is so pure and natural. I\'ve replaced all refined sugar in my home with this. Best decision ever!', rating: 5, avatar: '👩‍🦱' },
  { name: 'Suresh Nair', city: 'Chennai', text: 'Wild Forest Honey has a unique depth of flavour. I use it every morning and feel so much more energetic throughout the day.', rating: 5, avatar: '🧔' },
]

export default function HomePage() {
  const { products } = useProducts()
  const featuredProducts = products.filter((p) => p.isFeatured && p.status === 'active').slice(0, 4)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setActiveTestimonial((p) => (p + 1) % testimonials.length), 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[600px] flex items-center">
        {/* Background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(/hero-bg.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(4px) brightness(0.35)',
            transform: 'scale(1.08)',
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(135deg, rgba(45,80,22,0.75) 0%, rgba(139,69,19,0.55) 100%)' }} />

        {/* Decorative circles */}
        <div className="absolute top-10 right-10 w-64 h-64 rounded-full opacity-10 z-0" style={{ background: 'radial-gradient(circle, #F5F0E8, transparent)' }} />
        <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full opacity-10 z-0" style={{ background: 'radial-gradient(circle, #F5F0E8, transparent)' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-cream text-xs font-semibold tracking-widest uppercase">100% Organic · Farm to Table</span>
              </div>
              <h1 className="font-serif text-5xl md:text-6xl font-bold text-cream leading-tight mb-6 drop-shadow-lg">
                Pure Goodness,<br />
                <span style={{ color: '#F5C842' }}>Straight from</span><br />
                Nature
              </h1>
              <p className="text-cream/85 text-lg mb-8 leading-relaxed max-w-lg">
                Discover our curated range of raw honey, A2 ghee and organic sweeteners — sourced directly from trusted farmers across India.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-3.5 font-bold rounded-xl text-green shadow-xl transition-all hover:scale-105 hover:shadow-2xl" style={{ background: 'linear-gradient(135deg, #F5F0E8, #EDE5D0)' }}>
                  🛒 Shop Now
                </Link>
                <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-3.5 font-semibold rounded-xl border-2 border-cream/60 text-cream hover:bg-cream/10 transition-all">
                  Explore Products →
                </Link>
              </div>

              {/* Mini stats */}
              <div className="flex gap-8 mt-10">
                {[
                  { value: 5000, suffix: '+', label: 'Happy Customers' },
                  { value: 100, suffix: '%', label: 'Pure & Natural' },
                  { value: 4, suffix: '', label: 'Premium Products' },
                ].map(({ value, suffix, label }) => (
                  <div key={label}>
                    <p className="text-2xl font-bold text-amber-300 font-serif">
                      <Counter target={value} suffix={suffix} />
                    </p>
                    <p className="text-cream/70 text-xs mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Combined product showcase image */}
            <div className="hidden md:flex items-center justify-center">
              <Link to="/shop" className="group rounded-3xl overflow-hidden shadow-2xl hover:scale-105 transition-transform duration-300 w-full">
                <img
                  src="https://iili.io/BQTHvpa.jpeg"
                  alt="Siddha Organics Products"
                  className="w-full h-full object-cover"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BADGES ─────────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(90deg, #2D5016 0%, #4A7C2F 50%, #2D5016 100%)' }} className="py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-8">
          {[
            { icon: '🌿', label: 'Certified Organic' },
            { icon: '🐝', label: 'Raw & Unprocessed' },
            { icon: '🚚', label: 'Free Shipping ₹500+' },
            { icon: '🔒', label: 'Secure Payments' },
            { icon: '🏆', label: 'Premium Quality' },
            { icon: '🌱', label: 'Farm Fresh' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-xl">{icon}</span>
              <span className="text-cream text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(180deg, #FFFBF0 0%, #F5F0E8 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">Our Best Sellers</span>
            <h2 className="font-serif text-4xl font-bold text-green mb-3">Featured Products</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Handpicked for their exceptional quality, purity, and taste.</p>
          </div>

          {products.length === 0 ? (
            <LoadingState message="Loading products…" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} eager hideAddToCart />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/shop" className="inline-flex items-center gap-2 px-10 py-4 font-bold rounded-xl text-cream shadow-lg hover:shadow-xl hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}>
              View All Products →
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-green/10 text-green text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">Why Siddha Organics</span>
            <h2 className="font-serif text-4xl font-bold text-green">The Siddha Difference</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🌾',
                title: 'Direct from Farmers',
                desc: 'We partner directly with small-scale farmers and tribal communities, cutting out middlemen to ensure fair prices and maximum freshness.',
                color: '#ECFDF5',
                border: '#6EE7B7',
              },
              {
                icon: '🔬',
                title: 'Lab Tested Quality',
                desc: 'Every batch is tested for purity, authenticity, and nutritional value. No adulteration, no shortcuts — just nature\'s best.',
                color: '#EFF6FF',
                border: '#93C5FD',
              },
              {
                icon: '🌿',
                title: 'Zero Chemicals',
                desc: 'No pesticides, no preservatives, no artificial additives. Our products are as close to nature as they can possibly be.',
                color: '#FFF7ED',
                border: '#FCD34D',
              },
              {
                icon: '📦',
                title: 'Eco-Friendly Packaging',
                desc: 'We use sustainable, recyclable packaging that keeps your products fresh while being kind to the planet.',
                color: '#F0FDF4',
                border: '#86EFAC',
              },
              {
                icon: '🚀',
                title: 'Fast Delivery',
                desc: 'Orders dispatched within 24 hours. Free shipping on orders above ₹500. Delivered fresh to your doorstep.',
                color: '#FDF4FF',
                border: '#D8B4FE',
              },
              {
                icon: '💯',
                title: '100% Satisfaction',
                desc: 'Not happy? We offer a full refund, no questions asked. Your satisfaction is our top priority.',
                color: '#FFF1F2',
                border: '#FDA4AF',
              },
            ].map(({ icon, title, desc, color, border }) => (
              <div
                key={title}
                className="rounded-2xl p-6 border-2 hover:shadow-lg transition-shadow"
                style={{ background: color, borderColor: border }}
              >
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="font-bold text-green text-lg mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(135deg, #F5F0E8 0%, #EDE5D0 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-brown/10 text-brown text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">Browse</span>
            <h2 className="font-serif text-4xl font-bold text-green">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { label: 'Honey', icon: '🍯', category: 'Honey', bg: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', text: '#92400E', count: '2 Products' },
              { label: 'Ghee', icon: '🧈', category: 'Ghee', bg: 'linear-gradient(135deg, #FEF9C3, #FEF08A)', text: '#713F12', count: '1 Product' },
              { label: 'Sweeteners', icon: '🌾', category: 'Sweeteners', bg: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)', text: '#065F46', count: '1 Product' },
              { label: 'Spices', icon: '🌶️', category: 'Spices', bg: 'linear-gradient(135deg, #FEE2E2, #FECACA)', text: '#991B1B', count: 'Coming Soon' },
            ].map(({ label, icon, category, bg, text, count }) => (
              <Link
                key={category}
                to={`/shop?category=${category}`}
                className="group flex flex-col items-center gap-3 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all hover:scale-105 text-center"
                style={{ background: bg }}
              >
                <span className="text-5xl group-hover:scale-110 transition-transform">{icon}</span>
                <span className="font-bold text-lg" style={{ color: text }}>{label}</span>
                <span className="text-xs font-medium opacity-70" style={{ color: text }}>{count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── BRAND STORY ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="relative flex items-center justify-center">
            {/* Subtle background circle */}
            <div className="absolute w-72 h-72 rounded-full" style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)', opacity: 0.08 }} />
            <div className="relative rounded-3xl shadow-xl overflow-hidden">
              <img
                src="https://www.image2url.com/r2/default/images/1780742274635-913a5ef0-80b3-40fa-927c-6b28ce2dc610.png"
                alt="Siddha Organics"
                className="w-full h-auto max-w-sm object-contain"
              />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 border border-gray-100">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="font-bold text-green text-xs">Award Winning</p>
                <p className="text-xs text-gray-500">Organic Products 2024</p>
              </div>
            </div>
          </div>

          <div>
            <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">Our Story</span>
            <h2 className="font-serif text-4xl font-bold text-green mb-6 leading-tight">
              Rooted in Tradition,<br />
              <span className="text-brown">Committed to Purity</span>
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Siddha Organics was born from a simple belief: that the best food comes from nature, untouched by chemicals and processed with care. We partner directly with small-scale farmers and tribal communities across India.
            </p>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Every product in our range is tested for quality and authenticity. From raw honey harvested in pristine forests to A2 ghee made using the ancient Bilona method — we ensure that what reaches your table is nothing but the best.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { value: '2019', label: 'Founded' },
                { value: '50+', label: 'Farmer Partners' },
                { value: '4.9★', label: 'Avg Rating' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #F5F0E8, #EDE5D0)' }}>
                  <p className="font-bold text-xl text-green font-serif">{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-3.5 font-bold rounded-xl text-cream hover:scale-105 transition-all shadow-lg" style={{ background: 'linear-gradient(135deg, #8B4513, #A0522D)' }}>
              Explore Our Range →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(135deg, #2D5016 0%, #1A3009 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-white/10 text-cream text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">Testimonials</span>
          <h2 className="font-serif text-4xl font-bold text-cream mb-12">What Our Customers Say</h2>

          {/* Active testimonial */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 mb-8 transition-all">
            <div className="text-5xl mb-4">{testimonials[activeTestimonial].avatar}</div>
            <div className="flex justify-center gap-1 mb-4">
              {Array(testimonials[activeTestimonial].rating).fill(0).map((_, i) => (
                <span key={i} className="text-amber-400 text-xl">★</span>
              ))}
            </div>
            <p className="text-cream/90 text-lg italic leading-relaxed mb-6">
              "{testimonials[activeTestimonial].text}"
            </p>
            <p className="font-bold text-cream">{testimonials[activeTestimonial].name}</p>
            <p className="text-cream/60 text-sm">{testimonials[activeTestimonial].city}</p>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`rounded-full transition-all ${i === activeTestimonial ? 'w-8 h-3 bg-amber-400' : 'w-3 h-3 bg-white/30'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #FCD34D 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-4xl font-bold text-green mb-4 flex items-center justify-center gap-3">
            Ready to Go Organic?
            <SiddhaLogo variant="dark" size="sm" showText={false} className="inline-flex align-middle" />
          </h2>
          <p className="text-green/70 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of happy customers who have made the switch to pure, natural, and organic products.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop" className="inline-flex items-center justify-center gap-2 px-10 py-4 font-bold rounded-xl text-cream shadow-xl hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}>
              🛒 Start Shopping
            </Link>
            <Link to="/register" className="inline-flex items-center justify-center gap-2 px-10 py-4 font-bold rounded-xl border-2 border-green text-green hover:bg-green hover:text-cream transition-all">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
