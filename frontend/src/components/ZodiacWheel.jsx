import { useMemo, useState, useRef, useCallback } from 'react'
import PlanetLabel from './PlanetLabel'
import { PLANET_META, ZODIAC_META } from '../utils/planets'

const CX = 300, CY = 300
const R = {
  outerRim:    278,
  zodiacOuter: 263,
  zodiacInner: 213,
  tickOuter:   211,
  tickInner:   207,
  tickMid:     203,
  tickMajor:   196,
  starRing:    205,
  planet:      175,
  innerBg:     210,
  center:       22,
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

function AxisArrow({ lon, label, endR, lblR, lyOff = 0, minor = false }) {
  const tip  = lonXY(lon, endR)
  const base = lonXY(lon, endR + 12)
  const dx = tip.x - base.x, dy = tip.y - base.y
  const len = Math.sqrt(dx*dx + dy*dy) || 1
  const nx = dx/len, ny = dy/len
  const px = -ny, py = nx
  const a1x = (base.x + px*1.8).toFixed(2), a1y = (base.y + py*1.8).toFixed(2)
  const a2x = (base.x - px*1.8).toFixed(2), a2y = (base.y - py*1.8).toFixed(2)
  const lp  = lonXY(lon, lblR)
  const arrowFill  = minor ? "rgba(180,195,215,0.32)" : "rgba(210,218,228,0.45)"
  const textFill   = minor ? "rgba(170,185,210,0.48)" : "rgba(200,210,225,0.72)"
  const fontSize   = minor ? "9.5" : "11"
  // small radial ticks around axis point
  const ticks = [-4, -2, 2, 4].map(off => {
    const inner = lonXY(lon + off, endR - 1)
    const outer = lonXY(lon + off, endR + 3)
    return { inner, outer, key: off }
  })
  return (
    <g>
      {ticks.map(t => (
        <line key={t.key}
          x1={t.inner.x} y1={t.inner.y} x2={t.outer.x} y2={t.outer.y}
          stroke="rgba(200,210,225,0.18)" strokeWidth="0.4"/>
      ))}
      <polygon points={`${tip.x},${tip.y} ${a1x},${a1y} ${a2x},${a2y}`}
        fill={arrowFill}/>
      <text x={lp.x} y={lp.y + lyOff} textAnchor={rimAnchor(lp)} dominantBaseline="middle"
        fontSize={fontSize} fill={textFill}
        style={{ fontFamily: 'Orbitron, monospace', letterSpacing: '0.08em' }}>
        {label}
      </text>
    </g>
  )
}

export default function ZodiacWheel({ planets = [], angles = null, stars = [], conjunctions = [], showPlanets = true, showStars = true }) {
  const [activeP, setActiveP] = useState(null)
  const svgRef = useRef(null)

  const segments = useMemo(() =>
    ZODIAC_META.map((sign, i) => ({
      ...sign,
      labelPos: lonXY(i * 30 + 15, (R.zodiacOuter + R.zodiacInner) / 2),
      path: arcPath(R.zodiacOuter, R.zodiacInner, i * 30, (i + 1) * 30),
    })), [])

  const ticks = useMemo(() => {
    const out = []
    for (let deg = 0; deg < 360; deg += 5) {
      const major = deg % 30 === 0
      const mid   = deg % 10 === 0 && !major
      out.push({
        deg,
        p1: lonXY(deg, R.tickOuter),
        p2: lonXY(deg, major ? R.tickMajor : mid ? R.tickMid : R.tickInner),
        major, mid, micro: false,
      })
    }
    for (let deg = 0; deg < 360; deg += 1) {
      if (deg % 5 === 0) continue
      out.push({
        deg,
        p1: lonXY(deg, R.tickOuter),
        p2: lonXY(deg, R.tickOuter - 2.2),
        major: false, mid: false, micro: true,
      })
    }
    return out
  }, [])

  const planetPositions = useMemo(() => {
    if (!planets.length) return []
    const sorted = [...planets].sort((a, b) => a.longitude - b.longitude)
    return sorted.map((planet, i) => {
      return { ...planet, meta: PLANET_META[planet.name], pos: lonXY(planet.longitude, R.planet) }
    })
  }, [planets])

  const starPositions = useMemo(() =>
    stars.map(s => ({ ...s, pos: lonXY(s.lon, R.starRing) })), [stars])

  const conjStarNames = useMemo(() => new Set((conjunctions ?? []).map(c => c.star)), [conjunctions])

  const axisPoints = useMemo(() => {
    if (!angles) return []
    const endR = R.zodiacInner - 3
    const lblR = R.outerRim + 22
    const items = [
      { lon: angles.asc, label: 'ASC' },
      { lon: angles.dsc, label: 'DSC' },
      { lon: angles.mc,  label: 'MC', minor: true  },
      { lon: angles.ic,  label: 'IC', minor: true  },
    ].map(a => ({ ...a, endR, lblR, lyOff: 0 }))
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const pi = lonXY(items[i].lon, lblR), pj = lonXY(items[j].lon, lblR)
        const dx = pi.x - pj.x, dy = pi.y - pj.y
        if (Math.sqrt(dx*dx + dy*dy) < 28) {
          const sign = pi.y <= CY ? -1 : 1
          items[i].lyOff =  sign * 8
          items[j].lyOff = -sign * 8
        }
      }
    }
    return items
  }, [angles])

  const axisPairs = useMemo(() => {
    if (!angles) return []
    const endR = R.zodiacInner - 3
    return [
      { key: 'asc-dsc', dash: undefined,
        p1: lonXY(angles.asc, endR), p2: lonXY(angles.dsc, endR) },
      { key: 'mc-ic',   dash: '4 6',
        p1: lonXY(angles.mc,  endR), p2: lonXY(angles.ic,  endR) },
    ]
  }, [angles])

  return (
    <div className="flex items-center justify-center w-full">
      <svg ref={svgRef} viewBox="-36 -36 672 672"
        style={{ width: 'clamp(380px, 44vw, 720px)', height: 'clamp(380px, 44vw, 720px)', filter: 'drop-shadow(0 0 32px rgba(60,85,130,0.12))' }}>
        <defs>
          <filter id="pGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="starGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="2.2" result="blur"/>
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
            <stop offset="78%"  stopColor="white" stopOpacity="0.04"/>
            <stop offset="86%"  stopColor="white" stopOpacity="0.055"/>
            <stop offset="94%"  stopColor="white" stopOpacity="0.025"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </radialGradient>
        </defs>

        <circle cx={CX} cy={CY} r={R.zodiacOuter + 1} fill="url(#ringGrad)"/>
        <circle cx={CX} cy={CY} r={R.outerRim} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.6"/>

        {segments.map((seg, i) => (
          <g key={i}>
            <path d={seg.path} fill="rgba(255,255,255,0.016)" stroke="rgba(255,255,255,0.09)" strokeWidth="0.4"/>
            <text x={seg.labelPos.x} y={seg.labelPos.y} textAnchor="middle" dominantBaseline="middle"
              fontSize="21" fill="rgba(200,208,220,0.72)" style={{ fontFamily: 'serif', userSelect: 'none' }}>
              {seg.symbol}
            </text>
          </g>
        ))}

        {ticks.map(({ deg, p1, p2, major, mid, micro }) => (
          <line key={deg} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={major ? 'rgba(255,255,255,0.20)' : mid ? 'rgba(255,255,255,0.09)' : micro ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)'}
            strokeWidth={major ? 0.9 : mid ? 0.5 : micro ? 0.25 : 0.35}/>
        ))}

        <circle cx={CX} cy={CY} r={R.innerBg} fill="url(#bgGrad)"/>
        <circle cx={CX} cy={CY} r={R.innerBg} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="0.45"/>

        {[152, 172].map(r => (
          <circle key={r} cx={CX} cy={CY} r={r} fill="none"
            stroke="rgba(255,255,255,0.04)" strokeWidth="0.4" strokeDasharray="1.5 10"/>
        ))}

        {[0, 90, 180, 270].map(deg => {
          const a = lonXY(deg, 32), b = lonXY(deg, R.innerBg - 2)
          return <line key={deg} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="rgba(255,255,255,0.04)" strokeWidth="0.4" strokeDasharray="1.5 9"/>
        })}

        <circle cx={CX} cy={CY} r={R.starRing} fill="none"
          stroke="rgba(255,245,180,0.18)" strokeWidth="0.6" strokeDasharray="1 6"/>

        {axisPairs.map(pair => (
          <line key={pair.key}
            x1={pair.p1.x} y1={pair.p1.y} x2={pair.p2.x} y2={pair.p2.y}
            stroke={pair.key === 'mc-ic' ? 'rgba(190,205,225,0.18)' : 'rgba(210,220,232,0.26)'} strokeWidth="0.5" strokeDasharray={pair.dash}/>
        ))}

        <g filter="url(#starGlow)" style={{ display: showStars ? 'block' : 'none' }}>
          {starPositions.map(s => {
            const isActive = conjStarNames.has(s.name)
            const labelPt  = lonXY(s.lon, R.starRing + 12)
            return (
              <g key={s.name}>
                <title>{s.name} {s.lon.toFixed(2)}</title>
                <circle cx={s.pos.x} cy={s.pos.y} r={isActive ? 5.5 : 3.8}
                  fill="none" stroke="rgba(255,252,220,0.04)" strokeWidth="0.5"/>
                {isActive && (
                  <circle cx={s.pos.x} cy={s.pos.y} r="7" fill="none"
                    stroke="rgba(255,240,140,0.30)" strokeWidth="0.7">
                    <animate attributeName="r" values="7;10;7" dur="4s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.30;0;0.30" dur="4s" repeatCount="indefinite"/>
                  </circle>
                )}
                <circle cx={s.pos.x} cy={s.pos.y}
                  r={isActive ? 3.0 : 2.0}
                  fill={isActive ? 'rgba(255,250,210,0.95)' : 'rgba(255,248,200,0.38)'}/>
                {isActive && (
                  <text x={lonXY(s.lon, R.starRing + 9).x} y={lonXY(s.lon, R.starRing + 9).y}
                    textAnchor={rimAnchor(lonXY(s.lon, R.starRing + 9))} dominantBaseline="middle"
                    fontSize="5.8"
                    fill="rgba(255,245,175,0.90)"
                    style={{ fontFamily: 'monospace', letterSpacing: '0.3px' }}>
                    {s.name}
                  </text>
                )}
              </g>
            )
          })}
        </g>

        {showStars && (conjunctions ?? []).map((c, i) => {
          const planet = planetPositions.find(p => p.name === c.planet)
          const star   = starPositions.find(s => s.name === c.star)
          if (!planet || !star || c.orb > 2.0) return null
          const opacity = Math.max(0.04, 0.18 - c.orb * 0.07)
          return (
            <line key={`cl-${i}`}
              x1={planet.pos.x} y1={planet.pos.y} x2={star.pos.x} y2={star.pos.y}
              stroke={`rgba(255,240,150,${opacity.toFixed(2)})`}
              strokeWidth="0.45" strokeDasharray="1.5 7"/>
          )
        })}

        {showPlanets && planetPositions.filter(p => p.retrograde).map(p => (
          <circle key={`rx-${p.name}`} cx={p.pos.x} cy={p.pos.y} r={10}
            fill="none" stroke="rgba(190,198,212,0.32)" strokeWidth="0.55" strokeDasharray="2 3.5">
            <animate attributeName="opacity" values="0.32;0.05;0.32" dur="4.5s" repeatCount="indefinite"/>
          </circle>
        ))}

        <g filter="url(#pGlow)" style={{ display: showPlanets ? 'block' : 'none' }}>
          {planetPositions.map(p => {
            const sz = PLANET_SIZE[p.name] ?? 18
            return (
              <g key={p.name}>
                <title>{p.name} {p.zodiac_sign} {p.longitude.toFixed(2)}{p.retrograde ? ' R' : ''}</title>
                <circle cx={p.pos.x} cy={p.pos.y} r="13" fill="transparent" style={{ cursor: 'pointer' }}
                  onClick={() => setActiveP(activeP?.name === p.name ? null : p)}/>
                <text x={p.pos.x} y={p.pos.y} textAnchor="middle" dominantBaseline="middle"
                  fontSize={sz} fill="rgba(220,225,235,0.88)"
                  style={{ fontFamily: 'serif', userSelect: 'none', pointerEvents: 'none' }}>
                  {p.meta.symbol}
                </text>
              </g>
            )
          })}
        </g>

        {axisPoints.map(a => (
          <AxisArrow key={a.label} lon={a.lon} label={a.label}
            endR={a.endR} lblR={a.lblR} lyOff={a.lyOff} minor={a.minor}/>
        ))}

        <circle cx={CX} cy={CY} r={R.center} fill="#030911" stroke="rgba(255,255,255,0.08)" strokeWidth="0.45"/>
        <circle cx={CX} cy={CY} r="9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.35"/>
        <line x1={CX-18} y1={CY} x2={CX+18} y2={CY} stroke="rgba(255,255,255,0.10)" strokeWidth="0.35"/>
        <line x1={CX} y1={CY-18} x2={CX} y2={CY+18} stroke="rgba(255,255,255,0.10)" strokeWidth="0.35"/>
        <circle cx={CX} cy={CY} r="2.0" fill="rgba(205,190,145,0.85)"/>

        <text x={CX} y={CY + R.outerRim + 26} textAnchor="middle"
          fontSize="6.5" fill="rgba(160,175,200,0.35)"
          style={{ fontFamily: 'monospace', letterSpacing: '0.18em' }}>
          SYMBOLIC SKY · SIDEREAL MODE
        </text>
      </svg>
      {activeP && (
        <PlanetLabel
          planet={activeP}
          conjunctions={conjunctions}
          pos={planetPositions.find(pp => pp.name === activeP.name)?.pos}
          svgRect={svgRef.current?.getBoundingClientRect()}
          onClose={() => setActiveP(null)}
        />
      )}
    </div>
  )
}
