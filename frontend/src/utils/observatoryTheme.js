// Observatory lighting themes: NIGHT / DUSK / DAY
// Applied as CSS variables on document.documentElement

export const THEMES = {
  night: {
    '--bg-page':        '#010508',
    '--bg-header':      'rgba(1,4,10,0.95)',
    '--bg-panel':       'rgba(3,8,18,0.85)',
    '--bg-panel-border':'rgba(14,165,233,0.10)',
    '--wheel-bg':       '#050d18',
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
    '--bg-page':        '#16100a',
    '--bg-header':      'rgba(20,14,8,0.96)',
    '--bg-panel':       'rgba(18,12,6,0.88)',
    '--bg-panel-border':'rgba(200,140,60,0.25)',
    '--wheel-bg':       '#120e08',
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
    '--bg-page':        '#2a4060',
    '--bg-header':      'rgba(30,50,80,0.96)',
    '--bg-panel':       'rgba(32,54,84,0.88)',
    '--bg-panel-border':'rgba(180,215,250,0.30)',
    '--wheel-bg':       '#1e3456',
    '--sky-top':        '#0e1e34',
    '--sky-mid':        '#1a3050',
    '--sky-bot':        '#243c60',
    '--twilight-op':    '0.55',
    '--atm-op':         '0.50',
    '--text-primary':   'rgba(230,240,255,0.97)',
    '--text-secondary': 'rgba(175,200,230,0.80)',
    '--star-op':        '0.45',
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
