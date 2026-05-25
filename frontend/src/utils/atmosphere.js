// Atmospheric Engine v0.1
// skyMode determined by Sun altitude

export function getSkyMode(planets) {
  const sun = planets?.find(p => p.name === 'Sun')
  if (!sun) return 'night'
  if (sun.altitude > 6)  return 'day'
  if (sun.altitude > -6) return 'dusk'
  return 'night'
}

// CSS variable sets per mode — colors TBD in v0.2
export const SKY_VARS = {
  day: {
    '--sky-top':        '#0a1628',
    '--sky-bottom':     '#0d1f3c',
    '--haze-color':     'rgba(20, 60, 120, 0.18)',
    '--horizon-glow':   'rgba(30, 80, 160, 0.12)',
    '--stars-opacity':  '0.3',
  },
  dusk: {
    '--sky-top':        '#0a0e1a',
    '--sky-bottom':     '#1a1020',
    '--haze-color':     'rgba(80, 30, 60, 0.22)',
    '--horizon-glow':   'rgba(180, 60, 20, 0.18)',
    '--stars-opacity':  '0.6',
  },
  night: {
    '--sky-top':        '#020608',
    '--sky-bottom':     '#020812',
    '--haze-color':     'rgba(5, 15, 35, 0.25)',
    '--horizon-glow':   'rgba(0, 30, 80, 0.10)',
    '--stars-opacity':  '1.0',
  },
}
