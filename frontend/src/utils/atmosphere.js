// Atmospheric Engine v0.2 — real sky, premium observatory

export function getSkyMode(planets) {
  const sun = planets?.find(p => p.name === 'Sun')
  if (!sun) return 'night'
  if (sun.altitude > 6)  return 'day'
  if (sun.altitude > -6) return 'dusk'
  return 'night'
}

export const SKY_VARS = {
  day: {
    // Cold steel blue — real daylight, observatory grade
    '--sky-bg':          '#0d1f3c',
    '--sky-top':         '#0f2347',
    '--sky-bottom':      '#1a3a5c',
    '--haze-color':      'rgba(160, 200, 240, 0.10)',
    '--horizon-glow':    'rgba(200, 225, 255, 0.09)',
    '--stars-opacity':   '0.08',
    '--atm-opacity':     '0.85',
  },
  dusk: {
    // Deep blue-violet upper, dusty rose/amber horizon
    '--sky-bg':          '#080a12',
    '--sky-top':         '#0a0c1a',
    '--sky-bottom':      '#1a0d18',
    '--haze-color':      'rgba(160, 80, 120, 0.15)',
    '--horizon-glow':    'rgba(200, 90, 50, 0.18)',
    '--stars-opacity':   '0.65',
    '--atm-opacity':     '0.90',
  },
  night: {
    // Deep navy space — maximum depth
    '--sky-bg':          '#020608',
    '--sky-top':         '#020608',
    '--sky-bottom':      '#03091a',
    '--haze-color':      'rgba(10, 25, 60, 0.18)',
    '--horizon-glow':    'rgba(5, 20, 60, 0.08)',
    '--stars-opacity':   '1.0',
    '--atm-opacity':     '0.6',
  },
}
