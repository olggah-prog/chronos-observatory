import { useMemo } from 'react'
import { PLANET_META, ZODIAC_META } from '../utils/planets'

const CX = 300, CY = 300
const R = {
  outerRim:    278,
  zodiacOuter: 263,
  zodiacInner: 213,
  tickOuter:   211,
  tickInner:   205,
  tickMajor:   194,
  planet:      175,
  innerBg:     210,
  center:       28,
  star:        205,
}

const PLANET_SIZE = {
  Sun: 24, Moon: 20,
  Mercury: 18, Venus: 18, Mars: 18,
  Jupiter: 18, Saturn: 18, Uranus: 18, Neptune: 18, Pluto: 18,
  NNode: 18, SNode: 18,
}

function lonXY(lon, r) {
  const rad = (270 - lon) * (Math.PI / 180)
  return { x: +(CX + r * Math.cos(rad)).toFixed(3), y: +(CY + r * Math.sin(rad)).toFixed(3) }
}

function arcPath(outerR, innerR, startLon, endLon) {
  const p1 = lonXY(startLon, outerR), p2 = lonXY(endLon, outerR)
  const p3 = lonXY(endLon, innerR),   p4 = lonXY(startLon, innerR)
  const large = (endLon - startLon) > 180 ? 1 : 0
  return [`M ${p1.x} ${p1.y}`, `A ${outerR} ${outerR} 0 ${large} 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`, `A ${innerR} ${innerR} 0 ${large} 1 ${p4.x} ${p4.y}`, 'Z'].join(' ')
}

function rimAnchor(pt) {
  if (pt.x < CX - 15) return 'end'
  if (pt.x > CX + 15) return 'start'
  return 'middle'
}

export default function ZodiacWheel({ planets = [], angles = null, stars = [], conjunctions = [] }) {
  const segments = useMemo(() =>
    ZODIAC_META.map((sign, i) => ({
      ...sign,
      labelPos: lonXY(i * 30 + 15, (R.zodiacOuter + R.zodiacInner) / 2),
      path: arcPath(R.zodiacOuter, R.zodiacInner, i * 30, (i + 1) * 30),
    })), [])

  const ticks = useMemo(() => {
    const out = []
    for (let deg = 0; deg < 360; deg += 10) {
      const major = deg % 30 === 0
      out.push({ deg, p1: lonXY(deg, R.tickOuter), p2: lonXY(deg, major ? R.tickMajor : R.tickInner), major })
    }
    return out
  }, [])

  const planetPositions = useMemo(() => {
    if (!planets.length) return []
    const sorted = [...planets].sort((a, b) => a.longitude - b.longitude)
    return sorted.map((planet, i) => {
      const nearby = sorted.filter((p, j) => j !== i && Math.abs(p.longitude - planet.longitude) < 9)
      const rShift = nearby.length > 0 ? (i % 2 === 0 ? -18 : 16) : 0
      return { ...planet, meta: PLANET_META[planet.name], pos: lonXY(planet.longitude, R.planet + rShift) }
    })
  }, [planets])

  const starPositions = useMemo(() =>
    stars.map(s => ({ ...s, pos: lonXY(s.lon, R.star) })), [stars])

  const conjStarNames = useMemo(() => new Set((conjunctions ?? []).map(c => c.star)), [conjunctions])

  const axisPairs = useMemo(() => {
    if (!angles) return []
    const endR = R.zodiacInner - 4, lblR = R.outerRim + 20
    const defs = [
      { key: 'asc-dsc', dash: undefined, sides: [{ lon: angles.asc, label: 'ASC' }, { lon: angles.dsc, label: 'DSC' }] },
      { key: 'mc-ic',   dash: '4 5',     sides: [{ lon: angles.mc,  label: 'MC'  }, { lon: angles.ic,  label: 'IC'  }] },
    ]
    const pts = defs.flatMap(d => d.sides).map(s => ({ ...s, p: lonXY(s.lon, endR), lp: lonXY(s.lon, lblR), lyOff: 0 }))
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].lp.x - pts[j].lp.x, dy = pts[i].lp.y - pts[j].lp.y
        if (Math.sqrt(dx*dx + dy*dy) < 28) {
          const sign = pts[i].lp.y <= CY ? -1 : 1
          pts[i].lyOff = sign * 8; pts[j].lyOff = -sign * 8
        }
      }
    }
    return defs.map((d, di) => ({ ...d, ends: d.sides.map((_, si) => pts[di * 2 + si]) }))
  }, [angles])

  return (
    <div className="flex items-center justify-center w-full">
      <svg viewBox="-36 -36 672 672" className="w-full max-w-[540px]"
        style={{ filter: 'drop-shadow(0 0 28px rgba(80,100,140,0.14))' }}>
        <defs>
          <filter id="pGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.6" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="starGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.8" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#070f1c"/>
            <stop offset="70%"  stopColor="#040c16"/>
            <stop offset="100%" stopColor="#030a12"/>
          </radialGradient>
          <radialGradient id="ringGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="white" stopOpacity="0"/>
            <stop offset="74%"  stopColor="white" stopOpacity="0"/>
            <stop offset="78%"  stopColor="white" stopOpacity="0.045"/>
            <stop offset="86%"  stopColor="white" stopOpacity="0.06"/>
            <stop offset="94%"  stopColor="white" stopOpacity="0.03"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </radialGradient>
        </defs>

        <circle cx={CX} cy={CY} r={R.zodiacOuter + 1} fill="url(#ringGrad)"/>
        <circle cx={CX} cy={CY} r={R.outerRim} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.7"/>

        {segments.map((seg, i) => (
          <g key={i}>
            <path d={seg.path} fill="rgba(255,255,255,0.018)" stroke="rgba(255,255,255,0.10)" strokeWidth="0.45"/>
            <text x={seg.labelPos.x} y={seg.labelPos.y} textAnchor="middle" dominantBaseline="middle"
              fontSize="21" fill="rgba(210,215,225,0.68)" style={{ fontFamily: 'serif', userSelect: 'none' }}>
              {seg.symbol}
            </text>
          </g>
        ))}

        {ticks.map(({ deg, p1, p2, major }) => (
          <line key={deg} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={major ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}
            strokeWidth={major ? 1.0 : 0.45}/>
        ))}

        <circle cx={CX} cy={CY} r={R.innerBg} fill="url(#bgGrad)"/>
        <circle cx={CX} cy={CY} r={R.innerBg} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5"/>

        {[148, 168, 188].map(r => (
          <circle key={r} cx={CX} cy={CY} r={r} fill="none"
            stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 10"/>
        ))}

        {[0, 90, 180, 270].map(deg => {
          const a = lonXY(deg, 34), b = lonXY(deg, R.innerBg - 2)
          return <line key={deg} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 9"/>
        })}

        {axisPairs.map(pair => (
          <line key={pair.key}
            x1={pair.ends[0].p.x} y1={pair.ends[0].p.y}
            x2={pair.ends[1].p.x} y2={pair.ends[1].p.y}
            stroke="rgba(220,225,232,0.42)" strokeWidth="0.8" strokeDasharray={pair.dash}/>
        ))}

        {/* Fixed stars */}
        <g filter="url(#starGlow)">
          {starPositions.map(s => {
            const isActive = conjStarNames.has(s.name)
            return (
              <g key={s.name}>
                <title>{s.name} · {s.lon.toFixed(2)}°</title>
                {isActive && (
                  <circle cx={s.pos.x} cy={s.pos.y} r="4.5" fill="none"
                    stroke="rgba(255,240,160,0.30)" strokeWidth="0.6">
                    <animate attributeName="opacity" values="0.30;0.06;0.30" dur="3.5s" repeatCount="indefinite"/>
                  </circle>
                )}
                <circle cx={s.pos.x} cy={s.pos.y}
                  r={isActive ? 2.0 : 1.5}
                  fill={isActive ? 'rgba(255,245,190,0.80)' : 'rgba(255,245,200,0.40)'}/>
              </g>
            )
          })}
        </g>

        {/* Conjunction lines */}
        {(conjunctions ?? []).map((c, i) => {
          const planet = planetPositions.find(p => p.name === c.planet)
          const star   = starPositions.find(s => s.name === c.star)
          if (!planet || !star || c.orb > 2.0) return null
          const opacity = Math.max(0.05, 0.22 - c.orb * 0.08)
          return (
            <line key={`cl-${i}`}
              x1={planet.pos.x} y1={planet.pos.y} x2={star.pos.x} y2={star.pos.y}
              stroke={`rgba(255,240,160,${opacity.toFixed(2)})`}
              strokeWidth="0.5" strokeDasharray="2 6"/>
          )
        })}

        {/* Retrograde */}
        {planetPositions.filter(p => p.retrograde).map(p => (
          <circle key={`rx-${p.name}`} cx={p.pos.x} cy={p.pos.y} r={10}
            fill="none" stroke="rgba(200,205,215,0.40)" strokeWidth="0.65" strokeDasharray="2 3.5">
            <animate attributeName="opacity" values="0.40;0.06;0.40" dur="4s" repeatCount="indefinite"/>
          </circle>
        ))}

        <g filter="url(#pGlow)">
          {planetPositions.map(p => {
            const sz = PLANET_SIZE[p.name] ?? 18
            return (
              <g key={p.name}>
                <title>{p.name} · {p.zodiac_sign} {p.longitude.toFixed(2)}°{p.retrograde ? ' ℞' : ''}</title>
                <circle cx={p.pos.x} cy={p.pos.y} r="13" fill="transparent" style={{ cursor: 'default' }}/>
                <text x={p.pos.x} y={p.pos.y} textAnchor="middle" dominantBaseline="middle"
                  fontSize={sz} fill="rgba(225,228,235,0.90)"
                  style={{ fontFamily: 'serif', userSelect: 'none', pointerEvents: 'none' }}>
                  {p.meta.symbol}
                </text>
              </g>
            )
          })}
        </g>

        {axisPairs.map(pair =>
          pair.ends.map(({ p, lp, label, lyOff }) => (
            <g key={label}>
              <circle cx={p.x} cy={p.y} r="2" fill="rgba(220,225,232,0.70)"/>
              <text x={lp.x} y={lp.y + lyOff} textAnchor={rimAnchor(lp)} dominantBaseline="middle"
                fontSize="11" fill="rgba(210,218,228,0.80)"
                style={{ fontFamily: 'Orbitron, monospace', letterSpacing: '0.06em' }}>
                {label}
              </text>
            </g>
          ))
        )}

        <circle cx={CX} cy={CY} r={R.center} fill="#030911" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5"/>
        <circle cx={CX} cy={CY} r="11" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.4"/>
        <line x1={CX-20} y1={CY} x2={CX+20} y2={CY} stroke="rgba(255,255,255,0.12)" strokeWidth="0.4"/>
        <line x1={CX} y1={CY-20} x2={CX} y2={CY+20} stroke="rgba(255,255,255,0.12)" strokeWidth="0.4"/>
        <circle cx={CX} cy={CY} r="2.2" fill="rgba(210,195,150,0.80)"/>
      </svg>
    </div>
  )
}
