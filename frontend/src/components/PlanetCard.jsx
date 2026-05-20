import { PLANET_META, ZODIAC_META } from '../utils/planets'

export default function PlanetCard({ planet }) {
  const meta = PLANET_META[planet.name]
  const sign = ZODIAC_META.find(z => z.name === planet.zodiac_sign)
  const isRetro = planet.retrograde
  const isMoon = planet.name === 'Moon'
  const isInner = planet.name === 'Mercury' || planet.name === 'Venus'

  const morningEvening = isInner
    ? (planet.morning_star ? 'MORNING' : 'EVENING')
    : null

  return (
    <div
      className="relative rounded overflow-hidden p-3 transition-transform duration-200 hover:scale-[1.02]"
      style={{
        background: 'rgba(5, 14, 26, 0.85)',
        border: `1px solid ${isRetro ? 'rgba(239,68,68,0.35)' : 'rgba(14,165,233,0.2)'}`,
        boxShadow: isRetro
          ? '0 0 12px rgba(239,68,68,0.15), inset 0 0 20px rgba(239,68,68,0.04)'
          : '0 0 8px rgba(14,165,233,0.08), inset 0 0 20px rgba(14,165,233,0.03)',
      }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(14,165,233,1) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,1) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Top-right badges */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5">
        {/* Visibility dot */}
        <span
          title={planet.visible ? 'Visible' : planet.above_horizon ? 'Above horizon — solar glare' : 'Below horizon'}
          className={`w-2 h-2 rounded-full flex-shrink-0 ${planet.visible ? 'animate-pulse-slow' : ''}`}
          style={{
            background: planet.visible ? '#4ade80' : planet.above_horizon ? '#ca8a04' : '#334155',
            boxShadow: planet.visible ? '0 0 6px rgba(74,222,128,0.8)' : 'none',
          }}
        />
        {/* Retrograde badge */}
        {isRetro && (
          <span className="text-[9px] font-bold text-red-400 border border-red-500/50 px-1.5 py-0.5 rounded tracking-widest animate-pulse-slow">
            ℞
          </span>
        )}
      </div>

      <div className="relative flex items-start gap-2.5">
        {/* Planet glyph */}
        <span
          className="text-[26px] leading-none mt-0.5 flex-shrink-0"
          style={{
            color: meta.color,
            textShadow: `0 0 12px ${meta.color}`,
            fontFamily: 'serif',
          }}
        >
          {meta.symbol}
        </span>

        <div className="flex-1 min-w-0">
          {/* Name */}
          <div
            className="text-[10px] font-bold tracking-[0.25em] uppercase text-slate-200 truncate pr-10"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            {planet.name}
          </div>

          {/* Sign + morning/evening star */}
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span style={{ color: sign?.color, fontFamily: 'serif' }} className="text-[13px] leading-none">
              {sign?.symbol}
            </span>
            <span className="text-[9px] tracking-widest" style={{ color: sign?.color }}>
              {planet.zodiac_sign.toUpperCase()}
            </span>
            {morningEvening && (
              <span
                className="text-[8px] px-1 py-0.5 rounded tracking-wider border"
                style={
                  planet.morning_star
                    ? { color: '#67e8f9', borderColor: 'rgba(103,232,249,0.35)', background: 'rgba(103,232,249,0.08)' }
                    : { color: '#fb923c', borderColor: 'rgba(251,146,60,0.35)', background: 'rgba(251,146,60,0.08)' }
                }
              >
                {morningEvening}
              </span>
            )}
          </div>

          {/* Data rows */}
          <div className="mt-2 space-y-0.5">
            <DataRow label="LON" value={`${planet.longitude.toFixed(3)}°`} color="#67e8f9" />
            <DataRow
              label="SPD"
              value={`${isRetro ? '−' : '+'}${Math.abs(planet.speed_deg_per_day).toFixed(4)}°/d`}
              color={isRetro ? '#f87171' : '#94a3b8'}
            />
            <DataRow label="AU" value={planet.distance_au.toFixed(4)} color="#64748b" />
            {planet.above_horizon && (
              <DataRow
                label="ALT"
                value={`${planet.altitude > 0 ? '+' : ''}${planet.altitude.toFixed(1)}°`}
                color="#a78bfa"
              />
            )}
            {isMoon && planet.illumination_pct != null && (
              <DataRow
                label="ILLUM"
                value={`${planet.illumination_pct.toFixed(1)}%`}
                color="#e2e8f0"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DataRow({ label, value, color }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[8px] text-slate-600 w-10 flex-shrink-0 tracking-wider">{label}</span>
      <span className="text-[10px] font-mono" style={{ color }}>{value}</span>
    </div>
  )
}
