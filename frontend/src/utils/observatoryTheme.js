// Observatory lighting themes: NIGHT / DUSK / DAY
// Applied as CSS variables on document.documentElement

export const THEMES = {
  night: {
    '--bg-page':        'radial-gradient(ellipse at 50% 0%, #07101e 0%, #020609 100%)',
    '--bg-panel':       'rgba(5,14,26,0.70)',
    '--bg-panel-border':'rgba(180,210,240,0.10)',
    '--sky-top':        '#010306',
    '--sky-mid':        '#010a14',
    '--sky-bot':        '#031828',
    '--twilight-op':    '0.32',
    '--atm-op':         '0.22',
    '--text-primary':   'rgba(200,215,235,0.82)',
    '--text-secondary': 'rgba(130,155,185,0.55)',
    '--star-op':        '1.0',
  },
  dusk: {
    '--bg-page':        'radial-gradient(ellipse at 50% 0%, #0e1828 0%, #060c18 100%)',
    '--bg-panel':       'rgba(8,18,32,0.72)',
    '--bg-panel-border':'rgba(200,220,245,0.13)',
    '--sky-top':        '#020510',
    '--sky-mid':        '#06122a',
    '--sky-bot':        '#0a2040',
    '--twilight-op':    '0.55',
    '--atm-op':         '0.35',
    '--text-primary':   'rgba(210,225,245,0.88)',
    '--text-secondary': 'rgba(150,175,205,0.65)',
    '--star-op':        '0.85',
  },
  day: {
    '--bg-page':        'radial-gradient(ellipse at 50% 0%, #1a2840 0%, #0d1828 100%)',
    '--bg-panel':       'rgba(12,22,40,0.78)',
    '--bg-panel-border':'rgba(200,225,255,0.16)',
    '--sky-top':        '#06101e',
    '--sky-mid':        '#0e2038',
    '--sky-bot':        '#163050',
    '--twilight-op':    '0.45',
    '--atm-op':         '0.42',
    '--text-primary':   'rgba(220,232,248,0.95)',
    '--text-secondary': 'rgba(165,190,220,0.75)',
    '--star-op':        '0.55',
  },
}

export function applyTheme(mode) {
  const t = THEMES[mode] || THEMES.night
  const root = document.documentElement
  Object.entries(t).forEach(([k, v]) => root.style.setProperty(k, v))
}

// Detect mode from Sun altitude
export function modeFromSunAlt(alt) {
  if (alt == null) return 'night'
  if (alt >  5)   return 'day'
  if (alt > -8)   return 'dusk'
  return 'night'
}
