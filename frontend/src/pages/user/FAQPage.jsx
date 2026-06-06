import React, { useState } from 'react'

const faqs = [
  {
    question: 'How long does shipping and delivery take?',
    answer:
      'We dispatch all orders within 24 hours of confirmation (Monday–Saturday). Standard delivery takes 3–5 business days across India. Express delivery (1–2 days) is available for select pin codes at an additional charge. You will receive a tracking link via SMS and email once your order is dispatched.',
  },
  {
    question: 'What is your return and refund policy?',
    answer:
      'We offer a 7-day hassle-free return policy. If you receive a damaged, defective, or incorrect product, please contact us within 7 days of delivery with photos. We will arrange a free pickup and issue a full refund or replacement within 5–7 business days. Opened products are eligible for return only if they are defective.',
  },
  {
    question: 'Are your products genuinely organic and certified?',
    answer:
      'Yes. All our products are sourced from certified organic farms and undergo third-party lab testing for purity, authenticity, and nutritional content. We hold FSSAI certification and our partner farms are certified by recognised organic certification bodies. You can request a copy of any product\'s test report by emailing us.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major payment methods including UPI (GPay, PhonePe, Paytm), credit and debit cards (Visa, Mastercard, RuPay), net banking, and Cash on Delivery (COD) for orders up to ₹5,000. All online payments are processed through a secure, PCI-DSS compliant payment gateway.',
  },
  {
    question: 'How can I track my order?',
    answer:
      'Once your order is dispatched, you will receive an SMS and email with a tracking link. You can also log in to your account, go to "My Orders", and click on any order to see its real-time status and delivery timeline. If you face any issues tracking your order, contact our support team.',
  },
  {
    question: 'Do you offer bulk or wholesale orders?',
    answer:
      'Yes! We offer special pricing for bulk orders (10+ units of any product) and wholesale partnerships for retailers, restaurants, and health stores. Please email us at support@siddhaorganics.com with your requirements, and our team will get back to you within 48 hours with a custom quote.',
  },
  {
    question: 'How should I store your products?',
    answer:
      'Raw honey should be stored at room temperature away from direct sunlight — never refrigerate it. A2 Ghee can be stored at room temperature in a cool, dry place for up to 12 months. Jaggery Powder should be kept in an airtight container away from moisture. All products have a best-before date printed on the packaging.',
  },
  {
    question: 'Can I cancel or modify my order after placing it?',
    answer:
      'Orders can be cancelled or modified within 2 hours of placement by contacting our support team. After 2 hours, the order may already be packed and dispatched. In that case, you can initiate a return once the product is delivered.',
  },
]

function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 px-1 text-left focus:outline-none group"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-green text-base group-hover:text-green-dark transition-colors">
          {question}
        </span>
        <span
          className="shrink-0 text-green text-lg transition-transform duration-300"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {/* Smooth expand/collapse via max-height transition */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? '500px' : '0px' }}
      >
        <p className="text-gray-600 leading-relaxed pb-5 px-1 text-sm">
          {answer}
        </p>
      </div>
    </div>
  )
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null)

  const handleToggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

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
            <span className="text-cream text-xs font-semibold tracking-widest uppercase">Help Centre</span>
          </div>
          <h1 className="font-serif text-5xl font-bold text-cream mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-cream/80 text-lg">
            Find quick answers to the most common questions about our products, orders, and policies.
          </p>
        </div>
      </section>

      {/* ── FAQ ACCORDION ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(135deg, #F5F0E8 0%, #EDE5D0 100%)' }}>
        <div className="max-w-3xl mx-auto">

          {/* Quick category pills */}
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            {['Shipping', 'Returns', 'Products', 'Payments', 'Orders', 'Wholesale'].map((tag) => (
              <span
                key={tag}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white border border-green/20 text-green"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-6 md:px-10 py-2">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onToggle={() => handleToggle(index)}
              />
            ))}
          </div>

          {/* Still have questions */}
          <div
            className="mt-10 rounded-2xl p-8 text-center"
            style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}
          >
            <h3 className="font-serif text-2xl font-bold text-cream mb-2">Still have questions?</h3>
            <p className="text-cream/80 mb-6">
              Can't find what you're looking for? Our support team is happy to help.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #F5F0E8, #EDE5D0)', color: '#2D5016' }}
            >
              📧 Contact Support
            </a>
          </div>

        </div>
      </section>

    </div>
  )
}
