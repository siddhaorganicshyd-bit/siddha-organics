import React from 'react'
import { Link } from 'react-router-dom'

const values = [
  {
    icon: '🌿',
    title: 'Purity',
    desc: 'Every product is free from additives, preservatives, and artificial ingredients. What you get is exactly what nature intended.',
    bg: '#F0FDF4',
    border: '#86EFAC',
  },
  {
    icon: '♻️',
    title: 'Sustainability',
    desc: 'We use eco-friendly packaging and support farming practices that protect the soil, water, and biodiversity for future generations.',
    bg: '#EFF6FF',
    border: '#93C5FD',
  },
  {
    icon: '🔍',
    title: 'Transparency',
    desc: 'We share the story behind every product — which farm it came from, how it was processed, and what tests it passed.',
    bg: '#FFF7ED',
    border: '#FCD34D',
  },
  {
    icon: '🤝',
    title: 'Community',
    desc: 'Fair trade is at our core. We pay farmers above-market prices and invest in the communities that grow our products.',
    bg: '#FDF4FF',
    border: '#D8B4FE',
  },
]

const farmers = [
  { name: 'Ravi Shankar', region: 'Nilgiris, Tamil Nadu', product: 'Wild Forest Honey', avatar: '👨‍🌾' },
  { name: 'Meena Devi', region: 'Rajasthan', product: 'Organic Jaggery', avatar: '👩‍🌾' },
  { name: 'Suresh Gowda', region: 'Karnataka', product: 'A2 Bilona Ghee', avatar: '🧑‍🌾' },
  { name: 'Lakshmi Bai', region: 'Uttarakhand', product: 'Tulsi Honey', avatar: '👩‍🌾' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-24 px-4 flex items-center justify-center text-center"
        style={{ background: 'linear-gradient(135deg, #2D5016 0%, #4A7C2F 60%, #8B4513 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute top-8 left-8 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #F5F0E8, transparent)' }} />
        <div className="absolute bottom-8 right-8 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #F5F0E8, transparent)' }} />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-cream text-xs font-semibold tracking-widest uppercase">Our Story</span>
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-cream leading-tight mb-6 drop-shadow-lg">
            Siddha Organics
          </h1>
          <p className="text-cream/85 text-xl leading-relaxed">
            Pure Goodness, Organic — bringing nature's finest products straight from Indian farmers to your home.
          </p>
        </div>
      </section>

      {/* ── BRAND STORY ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
              Founded in 2020
            </span>
            <h2 className="font-serif text-4xl font-bold text-green mb-6 leading-tight">
              Rooted in Tradition,<br />
              <span className="text-brown">Committed to Purity</span>
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Siddha Organics was founded in 2020 with a single mission: to bridge the gap between India's hardworking organic farmers and health-conscious families across the country. We saw a world where pure, natural food was becoming harder to find — and decided to change that.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Our founders grew up in households where food was grown, not manufactured. That upbringing shaped a deep respect for traditional farming methods — the Bilona ghee process, raw honey harvesting, and chemical-free cultivation that has sustained Indian communities for centuries.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Today, Siddha Organics works directly with over 50 farmers across India, ensuring every product that reaches your home is pure, traceable, and fairly sourced.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '2020', label: 'Founded', icon: '📅' },
              { value: '50+', label: 'Farmer Partners', icon: '🌾' },
              { value: '5000+', label: 'Happy Customers', icon: '😊' },
              { value: '100%', label: 'Organic Certified', icon: '✅' },
            ].map(({ value, label, icon }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center p-6 rounded-2xl text-center"
                style={{ background: 'linear-gradient(135deg, #F5F0E8, #EDE5D0)' }}
              >
                <span className="text-3xl mb-2">{icon}</span>
                <p className="font-bold text-2xl text-green font-serif">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION STATEMENT ────────────────────────────────────────────────── */}
      <section
        className="py-20 px-4"
        style={{ background: 'linear-gradient(135deg, #F5F0E8 0%, #EDE5D0 100%)' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-green/10 text-green text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            Our Mission
          </span>
          <h2 className="font-serif text-4xl font-bold text-green mb-8">
            "Pure Goodness, Organic"
          </h2>
          <div className="bg-white rounded-3xl p-10 shadow-sm border border-cream-dark">
            <p className="text-gray-700 text-xl leading-relaxed mb-6">
              Our mission is simple: deliver food that is exactly what it claims to be — no additives, no preservatives, no shortcuts. Every product comes directly from the source, processed minimally to preserve its natural goodness.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              {[
                { icon: '🚫', title: 'No Additives', desc: 'Zero artificial colours, flavours, or enhancers' },
                { icon: '🧪', title: 'No Preservatives', desc: 'Natural shelf life, nothing synthetic added' },
                { icon: '🌱', title: 'Direct from Source', desc: 'Farm to your table, no unnecessary middlemen' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green/5">
                  <span className="text-3xl">{icon}</span>
                  <p className="font-bold text-green">{title}</p>
                  <p className="text-sm text-gray-500 text-center">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FARMER PARTNERSHIPS ──────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              Our Farmers
            </span>
            <h2 className="font-serif text-4xl font-bold text-green mb-4">
              50+ Farmer Partners Across India
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              We work hand-in-hand with small-scale farmers and tribal communities, paying fair prices and supporting sustainable livelihoods. Every purchase you make directly supports these families.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {farmers.map(({ name, region, product, avatar }) => (
              <div
                key={name}
                className="flex items-center gap-4 p-6 rounded-2xl border-2 hover:shadow-md transition-shadow"
                style={{ background: '#FAFDF7', borderColor: '#86EFAC' }}
              >
                <span className="text-5xl">{avatar}</span>
                <div>
                  <p className="font-bold text-green text-lg">{name}</p>
                  <p className="text-sm text-gray-500">{region}</p>
                  <span className="inline-block mt-1 bg-green/10 text-green text-xs font-semibold px-3 py-0.5 rounded-full">
                    {product}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-3xl p-8 text-center"
            style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}
          >
            <h3 className="font-serif text-2xl font-bold text-cream mb-3">Fair Trade Practices</h3>
            <p className="text-cream/80 max-w-2xl mx-auto">
              We pay above-market prices, provide advance payments during planting season, and offer free organic certification support to all our partner farmers. When they thrive, we all thrive.
            </p>
          </div>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────────────────────────── */}
      <section
        className="py-20 px-4"
        style={{ background: 'linear-gradient(135deg, #F5F0E8 0%, #EDE5D0 100%)' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-brown/10 text-brown text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              What We Stand For
            </span>
            <h2 className="font-serif text-4xl font-bold text-green">Our Values</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon, title, desc, bg, border }) => (
              <div
                key={title}
                className="rounded-2xl p-6 border-2 hover:shadow-lg transition-shadow text-center"
                style={{ background: bg, borderColor: border }}
              >
                <span className="text-4xl mb-4 block">{icon}</span>
                <h3 className="font-bold text-green text-lg mb-3">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section
        className="py-16 px-4"
        style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #FCD34D 100%)' }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-4xl font-bold text-green mb-4">
            Taste the Difference
          </h2>
          <p className="text-green/70 text-lg mb-8">
            Experience the purity of farm-fresh organic products. Your health and the farmers who grow your food will thank you.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-10 py-4 font-bold rounded-xl text-cream shadow-xl hover:scale-105 transition-all"
            style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}
          >
            🛒 Shop Now
          </Link>
        </div>
      </section>

    </div>
  )
}
