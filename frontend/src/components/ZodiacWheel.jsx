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
}

// Optical size table — equal visual weight, not equal px.
// Venus ♀ and Mars ♂ have wide circle+stroke forms that dominate at 20px;
// Moon ☽ and Neptune ♆ have thin strokes that need a touch more size.
const PLANET_SIZE = {
  Sun:     39,
  Moon:    20,
  Mercury: 19,
  Venus:   17,
  Mars:    17,
  Jupiter: 19,
  Saturn:  19,
  Uranus:  20,
  Neptune: 20,
  Pluto:   19,
  NNode:   19,
  SNode:   19,
}

function lonXY(lon, r) {
  const rad = (270 - lon) * (Math.PI / 180)
  return { x: +(CX + r * Math.cos(rad)).toFixed(3), y: +(CY + r * Math.sin(rad)).toFixed(3) }
}

function arcPath(outerR, innerR, startLon, endLon) {
  const p1 = lonXY(startLon, outerR)
  const p2 = lonXY(endLon,   outerR)
  const p3 = lonXY(endLon,   innerR)
  const p4 = lonXY(startLon, innerR)
  const large = (endLon - startLon) > 180 ? 1 : 0
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerR} ${outerR} 0 ${large} 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerR} ${innerR} 0 ${large} 1 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ')
}

// Smart text anchor based on x-position on the rim
function rimAnchor(pt) {
  if (pt.x < CX - 15) return 'end'
  if (pt.x > CX + 15) return 'start'
  return 'middle'
}

export default function ZodiacWheel({ planets = [], angles = null }) {
  const segments = useMemo(() =>
    ZODIAC_META.map((sign, i) => ({
      ...sign,
      labelPos: lonXY(i * 30 + 15, (R.zodiacOuter + R.zodiacInner) / 2),
      path:     arcPath(R.zodiacOuter, R.zodiacInner, i * 30, (i + 1) * 30),
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
    const offsets = new Array(sorted.length).fill(0)
    const CLUSTER_DEG = 8   // planets within this arc are a cluster
    const STEP        = 14  // radial px between tiers

    // Find runs of planets within CLUSTER_DEG of the group's first member,
    // then spread them symmetrically around R.planet along the radius.
    let gs = 0
    for (let i = 1; i <= sorted.length; i++) {
      const done = i === sorted.length ||
                   sorted[i].longitude - sorted[gs].longitude >= CLUSTER_DEG
      if (done) {
        const n = i - gs
        if (n > 1) {
          for (let k = 0; k < n; k++)
            offsets[gs + k] = Math.round((k - (n - 1) / 2) * STEP)
        }
        gs = i
      }
    }

    return sorted.map((planet, i) => ({
      ...planet,
      meta: PLANET_META[planet.name],
      pos:  lonXY(planet.longitude, R.planet + offsets[i]),
    }))
  }, [planets])

  // Axis pair data — full-diameter lines + labels with adaptive overlap offset
  const axisPairs = useMemo(() => {
    if (!angles) return []
    const endR = R.zodiacInner - 4   // line terminates at inner zodiac edge
    const lblR = R.outerRim    + 20  // label row outside the rim

    // Build all 4 endpoints flat first so we can run collision detection across pairs
    const defs = [
      { key: 'asc-dsc', dash: undefined, sides: [
          { lon: angles.asc, label: 'ASC' },
          { lon: angles.dsc, label: 'DSC' },
        ]},
      { key: 'mc-ic', dash: '4 5', sides: [
          { lon: angles.mc,  label: 'MC'  },
          { lon: angles.ic,  label: 'IC'  },
        ]},
    ]

    const pts = defs.flatMap(d => d.sides).map(s => ({
      ...s,
      p:     lonXY(s.lon, endR),
      lp:    lonXY(s.lon, lblR),
      lyOff: 0,   // adaptive y-nudge applied below
    }))

    // Adaptive offset: push apart any two label positions closer than 28px
    // so labels from ASC-DSC and MC-IC don't collide when axes are nearly parallel
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx   = pts[i].lp.x - pts[j].lp.x
        const dy   = pts[i].lp.y - pts[j].lp.y
        if (Math.sqrt(dx * dx + dy * dy) < 28) {
          // Nudge each point away from center along y
          const sign = pts[i].lp.y <= CY ? -1 : 1
          pts[i].lyOff =  sign * 8
          pts[j].lyOff = -sign * 8
        }
      }
    }

    return defs.map((d, di) => ({
      ...d,
      ends: d.sides.map((_, si) => pts[di * 2 + si]),
    }))
  }, [angles])

  return (
    <div className="flex items-center justify-center w-full">
      <svg
        viewBox="-36 -36 672 672"
        className="w-full max-w-[540px]"
        style={{ filter: 'drop-shadow(0 0 28px rgba(80,100,140,0.14))' }}
      >
        <defs>
          {/* Subtle presence glow — just enough to separate glyphs from background */}
          <filter id="wGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="0.7" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Inner sky — deep navy, slightly warm at the edges */}
          <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#070f1c" />
            <stop offset="70%"  stopColor="#040c16" />
            <stop offset="100%" stopColor="#030a12" />
          </radialGradient>
          {/* Glassy ring — white tint that fades at both edges of the zodiac band */}
          <radialGradient id="ringGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="white" stopOpacity="0"    />
            <stop offset="74%"  stopColor="white" stopOpacity="0"    />
            <stop offset="78%"  stopColor="white" stopOpacity="0.045"/>
            <stop offset="86%"  stopColor="white" stopOpacity="0.06" />
            <stop offset="94%"  stopColor="white" stopOpacity="0.03" />
            <stop offset="100%" stopColor="white" stopOpacity="0"    />
          </radialGradient>
        </defs>

        {/* ── Glassy ring (full circle + inner bg will mask the centre) ── */}
        <circle cx={CX} cy={CY} r={R.zodiacOuter + 1} fill="url(#ringGrad)" />

        {/* Outer rim */}
        <circle cx={CX} cy={CY} r={R.outerRim}
          fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.7" />

        {/* Sign sector fills + boundaries + glyphs */}
        {segments.map((seg, i) => (
          <g key={i}>
            {/* Each segment gets a minimal fill for the glassy look */}
            <path d={seg.path}
              fill="rgba(255,255,255,0.018)"
              stroke="rgba(255,255,255,0.10)" strokeWidth="0.45" />
            <text
              x={seg.labelPos.x} y={seg.labelPos.y}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="21" fill="rgba(210,215,225,0.68)"
              style={{ fontFamily: 'serif', fontWeight: 'normal', userSelect: 'none', textRendering: 'geometricPrecision' }}>
              {seg.symbol}
            </text>
          </g>
        ))}

        {/* Tick marks — sign cusps and degree ticks */}
        {ticks.map(({ deg, p1, p2, major }) => (
          <line key={deg}
            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={major ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}
            strokeWidth={major ? 1.0 : 0.45}
          />
        ))}

        {/* Inner background — masks the centre, making the ring "float" */}
        <circle cx={CX} cy={CY} r={R.innerBg} fill="url(#bgGrad)" />
        <circle cx={CX} cy={CY} r={R.innerBg}
          fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" />

        {/* Orbital guide rings */}
        {[148, 168, 188].map(r => (
          <circle key={r} cx={CX} cy={CY} r={r}
            fill="none" stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.5" strokeDasharray="2 10" />
        ))}

        {/* Cardinal spokes */}
        {[0, 90, 180, 270].map(deg => {
          const a = lonXY(deg, 34), b = lonXY(deg, R.innerBg - 2)
          return <line key={deg} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 9" />
        })}

        {/* ── Axis lines only (labels rendered after planets for z-order) ── */}
        {axisPairs.map(pair => (
          <line key={pair.key}
            x1={pair.ends[0].p.x} y1={pair.ends[0].p.y}
            x2={pair.ends[1].p.x} y2={pair.ends[1].p.y}
            stroke="rgba(220,225,232,0.42)" strokeWidth="0.8"
            strokeDasharray={pair.dash}
          />
        ))}

        {/* ── Retrograde — thin white dashed ring, slow pulse ── */}
        {planetPositions.filter(p => p.retrograde).map(p => (
          <circle key={`rx-${p.name}`}
            cx={p.pos.x} cy={p.pos.y} r={10}
            fill="none" stroke="rgba(200,205,215,0.40)" strokeWidth="0.65"
            strokeDasharray="2 3.5">
            <animate attributeName="opacity" values="0.40;0.06;0.40" dur="4s" repeatCount="indefinite" />
          </circle>
        ))}

        {/* ── Planet + Node glyphs — bare symbol, white, no badge ── */}
        {planetPositions.map(p => {
          const sz = PLANET_SIZE[p.name] ?? 11
          return (
            <g key={p.name} filter="url(#wGlow)">
              <title>{p.name} · {p.zodiac_sign} {p.longitude.toFixed(2)}°{p.retrograde ? ' ℞' : ''}</title>
              {/* Invisible hit area — sized to match largest glyph */}
              <circle cx={p.pos.x} cy={p.pos.y} r="13"
                fill="transparent" style={{ cursor: 'default' }} />
              <text
                x={p.pos.x} y={p.pos.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={sz}
                fill="rgba(225,228,235,0.90)"
                style={{ fontFamily: 'serif', fontWeight: 'normal', userSelect: 'none', pointerEvents: 'none', textRendering: 'geometricPrecision' }}>
                {p.meta.symbol}
              </text>
            </g>
          )
        })}

        {/* ── Axis endpoint knots + labels — rendered last so they sit above glyphs ── */}
        {axisPairs.map(pair =>
          pair.ends.map(({ p, lp, label, lyOff }) => (
            <g key={label}>
              <circle cx={p.x} cy={p.y} r="2"
                fill="rgba(220,225,232,0.70)" />
              <text x={lp.x} y={lp.y + lyOff}
                textAnchor={rimAnchor(lp)} dominantBaseline="middle"
                fontSize="11" fill="rgba(210,218,228,0.80)"
                style={{ fontFamily: 'Orbitron, monospace', letterSpacing: '0.06em' }}>
                {label}
              </text>
            </g>
          ))
        )}

        {/* ── Center ornament ── */}
        <circle cx={CX} cy={CY} r={R.center}
          fill="#030911" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" />
        <circle cx={CX} cy={CY} r="11"
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.4" />
        <line x1={CX - 20} y1={CY} x2={CX + 20} y2={CY}
          stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
        <line x1={CX} y1={CY - 20} x2={CX} y2={CY + 20}
          stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
        <circle cx={CX} cy={CY} r="2.2"
          fill="rgba(210,195,150,0.80)" />
      </svg>
    </div>
  )
}
