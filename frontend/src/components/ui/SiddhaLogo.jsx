/**
 * SiddhaLogo — Official Siddha Organics logo.
 * Uses an external hosted image URL.
 *
 * Props:
 *   variant    'dark'   → used on cream/white backgrounds
 *              'light'  → used on dark/green backgrounds
 *   size       'xs' | 'sm' | 'md' | 'lg' | 'xl'
 *   showText   ignored — text is embedded in the logo image
 *   className  extra classes on the wrapper div
 */
import React from 'react'

const LOGO_URL = 'https://www.image2url.com/r2/default/images/1780742274635-913a5ef0-80b3-40fa-927c-6b28ce2dc610.png'

const sizes = {
  xs:  32,
  sm:  44,
  md:  56,
  lg:  96,
  xl: 140,
}

export default function SiddhaLogo({
  variant   = 'dark',
  size      = 'md',
  showText  = true,
  className = '',
}) {
  const dim = sizes[size] ?? sizes.md

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: dim, height: dim }}
    >
      <img
        src={LOGO_URL}
        alt="Siddha Organics"
        draggable={false}
        style={{
          width:     '100%',
          height:    '100%',
          objectFit: 'contain',
          display:   'block',
        }}
      />
    </div>
  )
}
