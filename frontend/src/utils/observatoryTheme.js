// Observatory lighting themes: NIGHT / DUSK / DAY
// Applied as CSS variables on document.documentElement

export const THEMES = {
  night: {
    '--bg-page':        '#020812',
    '--bg-header':      'rgba(2,8,18,0.88)',
    '--bg-panel':       'rgba(5,14,26,0.70)',
    '--bg-panel-border':'rgba(14,165,233,0.12)',
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
    '--bg-page':        '#060d1a',
    '--bg-header':      'rgba(6,12,24,0.90)',
    '--bg-panel':       'rgba(8,16,30,0.75)',
    '--bg-panel-border':'rgba(180,140,80,0.15)',
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
    '--bg-page':        '#1c2e48',
    '--bg-header':      'rgba(22,38,62,0.94)',
    '--bg-panel':       'rgba(24,40,64,0.82)',
    '--bg-panel-border':'rgba(160,195,235,0.22)',
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
