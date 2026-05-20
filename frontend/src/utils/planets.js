// U+FE0E = text-presentation selector — forces glyph rendering instead of
// full-colour emoji on macOS / iOS, which would show coloured squares in SVG.
const t = s => s + '︎'

export const PLANET_META = {
  Sun:     { symbol: t('☉'), color: '#c8a84a' },   // old gold
  Moon:    { symbol: t('☽'), color: '#a8b4c0' },   // cool silver
  Mercury: { symbol: t('☿'), color: '#788898' },   // steel blue-grey
  Venus:   { symbol: t('♀'), color: '#bea882' },   // warm ivory
  Mars:    { symbol: t('♂'), color: '#965848' },   // muted terracotta
  Jupiter: { symbol: t('♃'), color: '#988460' },   // warm bronze
  Saturn:  { symbol: t('♄'), color: '#989068' },   // pale ochre
  Uranus:  { symbol: t('♅'), color: '#688898' },   // muted cerulean
  Neptune: { symbol: t('♆'), color: '#607090' },   // slate blue
  Pluto:   { symbol: t('♇'), color: '#706878' },   // dim grey-purple
  NNode:   { symbol: t('☊'), color: '#9ab0c2' },   // North Node — pale silver-blue
  SNode:   { symbol: t('☋'), color: '#9ab0c2' },   // South Node — pale silver-blue
}

export const ZODIAC_META = [
  { name: 'Aries',       symbol: t('♈'), element: 'fire',  color: '#785040' },
  { name: 'Taurus',      symbol: t('♉'), element: 'earth', color: '#4a5a46' },
  { name: 'Gemini',      symbol: t('♊'), element: 'air',   color: '#445060' },
  { name: 'Cancer',      symbol: t('♋'), element: 'water', color: '#48486a' },
  { name: 'Leo',         symbol: t('♌'), element: 'fire',  color: '#785040' },
  { name: 'Virgo',       symbol: t('♍'), element: 'earth', color: '#4a5a46' },
  { name: 'Libra',       symbol: t('♎'), element: 'air',   color: '#445060' },
  { name: 'Scorpio',     symbol: t('♏'), element: 'water', color: '#48486a' },
  { name: 'Sagittarius', symbol: t('♐'), element: 'fire',  color: '#785040' },
  { name: 'Capricorn',   symbol: t('♑'), element: 'earth', color: '#4a5a46' },
  { name: 'Aquarius',    symbol: t('♒'), element: 'air',   color: '#445060' },
  { name: 'Pisces',      symbol: t('♓'), element: 'water', color: '#48486a' },
]
