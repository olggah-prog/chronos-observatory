import { useMemo } from 'react'
import { PLANET_META } from '../utils/planets'

const VW        = 900
const VH        = 500
const HORIZON_Y = 390
const ZENITH_Y  = 30
const SKY_H     = HORIZON_Y - ZENITH_Y   // 360

const toCompass = az  => (az + 180) % 360
const azToX     = caz => (caz / 360) * VW
const altToY    = alt => HORIZON_Y - (Math.min(Math.max(alt, 0), 90) / 90) * SKY_H

const ALT_GUIDES  = [30, 60, 90]
const MINOR_TICKS = [45, 135, 225, 315]
const NODE_NAMES  = new Set(['NNode', 'SNode'])

// Realistic star field — varied sizes, very dim, slow twinkle
const BG_STARS = Array.from({ length: 95 }, (_, i) => ({
  x:   +((Math.sin(i * 7.39  + 1.1) * 0.5 + 0.5) * VW).toFixed(1),
  y:   +((Math.abs(Math.sin(i * 11.3 + 0.7)) * 0.88 + 0.06) * SKY_H + ZENITH_Y).toFixed(1),
  r:   +(Math.abs(Math.sin(i * 3.17)) * 0.65 + 0.15).toFixed(2),
  op:  +(Math.abs(Math.sin(i * 5.91)) * 0.20 + 0.04).toFixed(2),
  dur: +(Math.abs(Math.sin(i * 2.31)) * 8  + 5.0).toFixed(1),
}))

const DOT_R   = { Sun: 8, Moon: 9.5, Venus: 7, Mercury: 5.5 }
const DEF_R   = 5
const LABELED = new Set(['Sun', 'Moon', 'Venus', 'Mercury'])

// ─── Accurate Moon phase ─────────────────────────────────────────────────────
function MoonPhase({ cx, cy, r, illumination_pct, waxing }) {
  const f     = illumination_pct / 100
  if (f < 0.02) return <circle cx={cx} cy={cy} r={r} fill="#0a1220" opacity="0.55" />
  if (f > 0.98) return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#a0acba" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#b8c4d0" strokeWidth="0.5" opacity="0.45" />
    </g>
  )
  const cos_a  = 1 - 2 * f
  const term_x = (Math.abs(cos_a) * r).toFixed(2)
  const sArc   = waxing ? 1 : 0
  const sTerm  = waxing ? (f < 0.5 ? 1 : 0) : (f < 0.5 ? 0 : 1)
  const d = `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${sArc} ${cx} ${cy + r} A ${term_x} ${r} 0 0 ${sTerm} ${cx} ${cy - r} Z`
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#0a1220" />
      <path d={d} fill="#9aa8b6" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#a8b8c8" strokeWidth="0.45" opacity="0.38" />
    </g>
  )
}

// ─── Angle marker (ASC / DSC / MC / IC) ──────────────────────────────────────
// Appears as a small diamond + thin vertical tick + label at its sky position.
function AngleMarker({ az, alt, label }) {
  if (alt < -2) return null   // well below horizon — skip
  const caz = toCompass(az)
  const x   = azToX(caz)
  const y   = altToY(Math.max(alt, 0))   // clamp to horizon if slightly below

  // diamond shape (4-point star)
  const s = 4
  const diamond = `M ${x} ${y - s} L ${x + s} ${y} L ${x} ${y + s} L ${x - s} ${y} Z`

  return (
    <g opacity="0.72">
      <line x1={x} y1={HORIZON_Y - 10} x2={x} y2={HORIZON_Y + 5}
        stroke="rgba(200,210,225,0.45)" strokeWidth="0.8" />
      <path d={diamond} fill="rgba(200,210,225,0.22)" stroke="rgba(200,210,225,0.70)" strokeWidth="0.6" />
      <text x={x} y={y - s - 6} textAnchor="middle"
        fontSize="7.5" fill="rgba(200,210,225,0.82)"
        style={{ fontFamily: 'Orbitron, monospace', letterSpacing: '0.04em' }}>
        {label}
      </text>
    </g>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function VisibleSkyMap({ planets = [], angles = null, paranEvents = [] }) {
  const bodies = useMemo(() => {
    const sunLon     = planets.find(p => p.name === 'Sun')?.longitude  ?? 0
    const moonLon    = planets.find(p => p.name === 'Moon')?.longitude ?? 0
    const moonWaxing = ((moonLon - sunLon + 360) % 360) < 180
    const sunAlt = planets.find(p => p.name === 'Sun')?.altitude ?? -90

    // Sky phase based on Sun altitude
    const skyPhase = sunAlt > 5 ? 'day'
      : sunAlt > -6  ? 'golden'
      : sunAlt > -12 ? 'twilight'
      : 'night'

    return planets
      .filter(p => p.above_horizon)
      .map(p => {
        const caz    = toCompass(p.azimuth)
        const waxing = p.name === 'Moon' ? moonWaxing : undefined
        const isNode = NODE_NAMES.has(p.name)
        return {
          ...p,
          meta:   PLANET_META[p.name],
          caz,
          x:      azToX(caz),
          y:      altToY(p.altitude),
          r:      isNode ? 3.5 : (DOT_R[p.name] ?? DEF_R),
          waxing,
          isNode,
        }
      })
  }, [planets])

  const visibleCount = bodies.filter(b => b.visible && !b.isNode).length

  // Paran rendering helpers — set of body names involved in any active paran event
  const paranBodies = useMemo(
    () => new Set(paranEvents.flatMap(e => e.bodies ?? [])),
    [paranEvents],
  )

  // Angle markers from the angles prop (ASC/DSC/MC/IC at their real sky positions)
  const angleMarkers = useMemo(() => {
    if (!angles) return []
    return [
      { key: 'asc', label: 'ASC', az: angles.asc_az, alt: angles.asc_alt },
      { key: 'dsc', label: 'DSC', az: angles.dsc_az, alt: angles.dsc_alt },
      { key: 'mc',  label: 'MC',  az: angles.mc_az,  alt: angles.mc_alt  },
      { key: 'ic',  label: 'IC',  az: angles.ic_az,  alt: angles.ic_alt  },
    ].filter(m => m.az != null && m.alt != null)
  }, [angles])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] tracking-[0.4em] text-slate-600 uppercase">
          Visible Sky — Alt / Az Panorama
        </span>
        <div className="flex items-center gap-5 text-[9px] tracking-[0.2em] text-slate-600 uppercase">
          <span>Above horizon: <span className="text-cyan-400">{bodies.filter(b => !b.isNode).length}</span></span>
          <span>Visible: <span className="text-green-400">{visibleCount}</span></span>
        </div>
      </div>

      <div
        className="rounded overflow-hidden"
        style={{ border: '1px solid rgba(14,165,233,0.08)', boxShadow: '0 0 32px rgba(0,0,0,0.75)' }}
      >
        <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full block">
          <defs>
            <linearGradient id="vsSkyBg" x1="0" y1="0" x2="0" y2="1">
              {skyPhase === 'day' && <>
                <stop offset="0%"   stopColor="#0e1e38" />
                <stop offset="50%"  stopColor="#1a2e50" />
                <stop offset="100%" stopColor="#243858" />
              </>}
              {skyPhase === 'golden' && <>
                <stop offset="0%"   stopColor="#080e1e" />
                <stop offset="45%"  stopColor="#0e1a30" />
                <stop offset="100%" stopColor="#1a2840" />
              </>}
              {skyPhase === 'twilight' && <>
                <stop offset="0%"   stopColor="#040810" />
                <stop offset="55%"  stopColor="#080e1c" />
                <stop offset="100%" stopColor="#0c1628" />
              </>}
              {skyPhase === 'night' && <>
                <stop offset="0%"   stopColor="#010306" />
                <stop offset="40%"  stopColor="#010a14" />
                <stop offset="78%"  stopColor="#021220" />
                <stop offset="100%" stopColor="#031828" />
              </>}
            </linearGradient>
            <linearGradient id="vsAtmBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#061828" stopOpacity="0"    />
              <stop offset="60%"  stopColor="#082230" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0a2838" stopOpacity="0.22" />
            </linearGradient>
            <linearGradient id="vsTwilight" x1="0" y1="0" x2="0" y2="1">
              {(skyPhase === 'golden') && <>
                <stop offset="0%"   stopColor="#0a1020" stopOpacity="0"    />
                <stop offset="30%"  stopColor="#2a1800" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#3a1e02" stopOpacity="0.55" />
              </>}
              {(skyPhase === 'twilight') && <>
                <stop offset="0%"   stopColor="#060c18" stopOpacity="0"    />
                <stop offset="40%"  stopColor="#1a0e04" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#241204" stopOpacity="0.38" />
              </>}
              {(skyPhase === 'day' || skyPhase === 'night') && <>
                <stop offset="0%"   stopColor="#0a1828" stopOpacity="0"    />
                <stop offset="35%"  stopColor="#1a0e04" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#2a1004" stopOpacity="0.15" />
              </>}
            </linearGradient>
            <filter id="vsPGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2.2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <clipPath id="vsSkyClip">
              <rect x="0" y="0" width={VW} height={HORIZON_Y}/>
            </clipPath>
          </defs>

          {/* Sky + ground */}
          <rect x="0" y="0" width={VW} height={HORIZON_Y} fill="url(#vsSkyBg)"/>
          <rect x="0" y={HORIZON_Y} width={VW} height={VH - HORIZON_Y} fill="#010508"/>

          {/* Background stars */}
          <g clipPath="url(#vsSkyClip)">
            {BG_STARS.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.op}>
                <animate attributeName="opacity"
                  values={`${s.op};${+(s.op * 0.20).toFixed(2)};${s.op}`}
                  dur={`${s.dur}s`} repeatCount="indefinite"/>
              </circle>
            ))}
          </g>

          {/* Azimuth grid */}
          {Array.from({ length: 13 }, (_, i) => i * 30).map(az => {
            const x     = azToX(az)
            const major = az % 90 === 0
            return (
              <line key={az} x1={x} y1={ZENITH_Y} x2={x} y2={HORIZON_Y}
                stroke={major ? 'rgba(14,28,44,0.55)' : 'rgba(8,16,26,0.40)'}
                strokeWidth={major ? 0.65 : 0.38}
                strokeDasharray={major ? '3 11' : '2 18'}
              />
            )
          })}

          {/* Altitude guides */}
          {ALT_GUIDES.map(alt => {
            const y = altToY(alt)
            return (
              <g key={alt}>
                <line x1="0" y1={y} x2={VW} y2={y}
                  stroke="rgba(10,22,36,0.60)" strokeWidth="0.55" strokeDasharray="3 15" />
                <text x="11" y={y - 5} fontSize="8" fill="rgba(24,48,72,0.65)" fontFamily="monospace">{alt}°</text>
                <text x={VW - 11} y={y - 5} textAnchor="end" fontSize="8" fill="rgba(24,48,72,0.65)" fontFamily="monospace">{alt}°</text>
              </g>
            )
          })}

          {/* Twilight warm band + atmospheric scatter */}
          <rect x="0" y={HORIZON_Y - 96} width={VW} height="96" fill="url(#vsTwilight)"/>
          <rect x="0" y={HORIZON_Y - 52} width={VW} height="52" fill="url(#vsAtmBlue)"/>

          {/* Horizon line */}
          <line x1="0" y1={HORIZON_Y} x2={VW} y2={HORIZON_Y}
            stroke="rgba(90,130,165,0.30)" strokeWidth="0.85"/>
          <line x1="0" y1={HORIZON_Y} x2={VW} y2={HORIZON_Y}
            stroke="#0ea5e9" strokeWidth="3" opacity="0.035"/>

          {/* Cardinal markers */}
          {[
            { l: 'N', x: 2,         anchor: 'start' },
            { l: 'E', x: azToX(90), anchor: 'middle' },
            { l: 'S', x: azToX(180),anchor: 'middle' },
            { l: 'W', x: azToX(270),anchor: 'middle' },
            { l: 'N', x: VW - 2,    anchor: 'end' },
          ].map(({ l, x, anchor }, i) => (
            <g key={i}>
              <line x1={x} y1={HORIZON_Y - 11} x2={x} y2={HORIZON_Y + 6}
                stroke="rgba(90,130,165,0.28)" strokeWidth="0.9"/>
              <text
                x={x + (anchor === 'start' ? 7 : anchor === 'end' ? -7 : 0)}
                y={HORIZON_Y + 21} textAnchor={anchor} fontSize="10"
                fill="rgba(72,112,150,0.55)"
                style={{ fontFamily: 'Orbitron, monospace' }}>{l}</text>
            </g>
          ))}
          {MINOR_TICKS.map(az => (
            <line key={az} x1={azToX(az)} y1={HORIZON_Y - 5} x2={azToX(az)} y2={HORIZON_Y + 3}
              stroke="rgba(72,110,145,0.20)" strokeWidth="0.6"/>
          ))}

          {/* ASC / DSC / MC / IC markers at their real sky positions */}
          {angleMarkers.map(m => (
            <AngleMarker key={m.key} az={m.az} alt={m.alt} label={m.label} />
          ))}

          {/* Panorama legend */}
          <text x={VW - 10} y={VH - 7} textAnchor="end" fontSize="7" fill="rgba(14,26,40,0.65)"
            style={{ fontFamily: 'monospace', letterSpacing: '0.2em' }}>
            ← N · E · S · W · N →
          </text>

          {/* ── Paran rendering layer ─────────────────────────────────────────
               Invisible when paranEvents is empty (default).
               When populated: soft pulse glow around each involved body,
               optional connection line, and a status label.
               Detection logic is external — this is the display layer only.
          ──────────────────────────────────────────────────────────────── */}
          {paranEvents.length > 0 && (
            <g clipPath="url(#vsSkyClip)">
              {/* Outer pulsing glow around each paran-active body */}
              {bodies.filter(b => paranBodies.has(b.name)).map(b => (
                <circle key={`paran-glow-${b.name}`}
                  cx={b.x} cy={b.y} r={b.r + 9}
                  fill="none" stroke="rgba(220,210,175,0.38)" strokeWidth="1.4">
                  <animate attributeName="opacity" values="0.38;0.07;0.38" dur="4s" repeatCount="indefinite" />
                </circle>
              ))}

              {/* Connection lines between paired bodies */}
              {paranEvents.map((evt, i) => {
                const [nA, nB] = evt.bodies ?? []
                const bA = bodies.find(b => b.name === nA)
                const bB = bodies.find(b => b.name === nB)
                if (!bA || !bB) return null
                return (
                  <line key={`paran-line-${i}`}
                    x1={bA.x} y1={bA.y} x2={bB.x} y2={bB.y}
                    stroke="rgba(220,210,175,0.30)" strokeWidth="0.65"
                    strokeDasharray="3 7">
                    <animate attributeName="opacity" values="0.30;0.05;0.30" dur="4s" repeatCount="indefinite" />
                  </line>
                )
              })}

              {/* Status label — top-right corner of sky area */}
              <text x={VW - 14} y={ZENITH_Y + 16}
                textAnchor="end" fontSize="10"
                fill="rgba(220,215,198,0.60)"
                style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                Paran active
              </text>
            </g>
          )}

          {/* Planet + Node bodies */}
          <g clipPath="url(#vsSkyClip)">
            {bodies.map(p => {
              const labeled = LABELED.has(p.name)

              if (p.isNode) {
                // Nodes: small white crosshair glyph — abstract point, no color
                return (
                  <g key={p.name} opacity={p.visible ? 0.55 : 0.18}>
                    <title>{p.name} · alt {p.altitude.toFixed(1)}° · az {p.azimuth.toFixed(1)}°</title>
                    <circle cx={p.x} cy={p.y} r={p.r}
                      fill="none" stroke="rgba(200,210,225,0.65)" strokeWidth="0.7" />
                    <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
                      fontSize="6" fill="rgba(200,210,225,0.80)"
                      style={{ fontFamily: 'serif', userSelect: 'none', pointerEvents: 'none' }}>
                      {p.meta.symbol}
                    </text>
                  </g>
                )
              }

              return (
                <g key={p.name} opacity={p.visible ? 1 : 0.09}>
                  <title>
                    {`${p.name}  ·  alt ${p.altitude.toFixed(1)}°  ·  az ${p.azimuth.toFixed(1)}° (S-ref)`}
                    {p.illumination_pct != null ? `  ·  ${p.illumination_pct.toFixed(0)}% lit` : ''}
                    {p.morning_star != null ? `  ·  ${p.morning_star ? 'morning' : 'evening'} star` : ''}
                    {!p.visible ? '  ·  solar glare' : ''}
                  </title>

                  {p.name === 'Moon' ? (
                    <MoonPhase cx={p.x} cy={p.y} r={p.r}
                      illumination_pct={p.illumination_pct ?? 50}
                      waxing={p.waxing ?? true} />
                  ) : (
                    <circle cx={p.x} cy={p.y} r={p.r}
                      fill={p.meta.color}
                      filter={p.visible ? 'url(#vsPGlow)' : undefined} />
                  )}

                  {p.name !== 'Moon' && (
                    <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
                      fontSize={p.r >= 8 ? '8' : '6'} fill="rgba(4,10,18,0.90)" fontWeight="bold"
                      style={{ fontFamily: 'serif', userSelect: 'none', pointerEvents: 'none' }}>
                      {p.meta.symbol}
                    </text>
                  )}

                  {labeled && (
                    <text x={p.x} y={p.y + p.r + 11} textAnchor="middle" fontSize="7.5"
                      fill={p.meta.color} opacity={p.visible ? 0.70 : 0.22}
                      style={{ fontFamily: 'monospace', userSelect: 'none' }}>
                      {p.name === 'Moon' && p.illumination_pct != null
                        ? `${p.illumination_pct.toFixed(0)}% lit`
                        : p.name.toUpperCase()}
                    </text>
                  )}
                </g>
              )
            })}
          </g>

          {bodies.filter(b => !b.isNode).length === 0 && (
            <text x={VW / 2} y={HORIZON_Y / 2} textAnchor="middle" dominantBaseline="middle"
              fontSize="10" fill="rgba(18,40,62,0.55)"
              style={{ fontFamily: 'monospace', letterSpacing: '0.3em' }}>
              NO BODIES ABOVE HORIZON
            </text>
          )}
        </svg>
      </div>
    </div>
  )
}
