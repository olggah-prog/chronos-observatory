import { useState, useEffect, useMemo, useCallback } from 'react'
import { applyTheme, modeFromSunAlt } from './utils/observatoryTheme'
import { useSkyData } from './hooks/useSkyData'
import { useInterpolatedSky } from './hooks/useInterpolatedSky'
import ZodiacWheel       from './components/ZodiacWheel'
import VisibleSkyMap     from './components/VisibleSkyMap'
import PlanetCard        from './components/PlanetCard'
import TimelineSlider    from './components/TimelineSlider'
import FixedStarContacts from './components/FixedStarContacts'
import SystemsDropdown   from './components/SystemsDropdown'

function StarField() {
  const stars = useMemo(() =>
    Array.from({ length: 200 }, (_, i) => ({
      id: i,
      x:   +((Math.sin(i * 7.391) * 0.5 + 0.5) * 100).toFixed(2),
      y:   +((Math.cos(i * 11.73) * 0.5 + 0.5) * 100).toFixed(2),
      r:   +((Math.abs(Math.sin(i * 3.17)) * 0.55 + 0.15)).toFixed(2),
      op:  +((Math.abs(Math.sin(i * 5.93)) * 0.55 + 0.2)).toFixed(2),
      dur: +((Math.abs(Math.sin(i * 2.31)) * 4 + 2)).toFixed(1),
    })), [])
  return (
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {stars.map(s => (
        <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white">
          <animate attributeName="opacity"
            values={`${s.op};${+(s.op * 0.25).toFixed(2)};${s.op}`}
            dur={`${s.dur}s`} repeatCount="indefinite"/>
        </circle>
      ))}
    </svg>
  )
}

function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="text-cyan-400 text-[12px] tracking-widest font-mono">
      {now.toISOString().replace('T', '  ').slice(0, 19)}  UTC
    </span>
  )
}

function TelemetryPanel({ planets }) {
  const [open, setOpen] = useState(false)
  const retroCount   = planets.filter(p => p.retrograde).length
  const visibleCount = planets.filter(p => p.visible).length
  return (
    <div className="mt-6">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 rounded transition-colors"
        style={{ background: open ? 'rgba(5,14,26,0.85)' : 'rgba(5,14,26,0.55)', border: '1px solid rgba(14,165,233,0.18)' }}>
        <div className="flex items-center gap-4">
          <span className="text-[10px] tracking-[0.3em] text-slate-400 uppercase font-display">Planetary Telemetry</span>
          <span className="text-[9px] text-slate-600 tracking-wider">
            {planets.length} bodies
            {retroCount > 0 && <span className="ml-2 text-red-500">· {retroCount} ℞</span>}
            {visibleCount > 0 && <span className="ml-2 text-green-500">· {visibleCount} visible</span>}
          </span>
        </div>
        <span className="text-[9px] tracking-[0.2em] text-cyan-800 select-none">{open ? '▲ COLLAPSE' : '▼ EXPAND'}</span>
      </button>
      <div style={{ maxHeight: open ? '1200px' : '0', overflow: 'hidden', transition: 'max-height 0.35s ease' }}>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {planets.map(p => <PlanetCard key={p.name} planet={p} />)}
        </div>
      </div>
    </div>
  )
}

function LoadingBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"/>
    </div>
  )
}

export default function App() {
  const [selectedDt, setSelectedDt] = useState('')
  const [seeking, setSeeking]       = useState(false)
  const [isPlaying, setIsPlaying]     = useState(false)
  const [showPlanets, setShowPlanets] = useState(true)
  const [showStars,   setShowStars]   = useState(true)
  const [lightMode, setLightMode]     = useState('auto')
  const { data: rawData, loading, error, refetch } = useSkyData(selectedDt)
  const data = useInterpolatedSky(rawData)

  useEffect(() => {
    if (lightMode === 'auto') {
      const sun = data?.planets?.find(p => p.name === 'Sun')
      applyTheme(modeFromSunAlt(sun?.altitude))
    } else {
      applyTheme(lightMode)
    }
  }, [lightMode, data])

  useEffect(() => { if (loading) setSeeking(false) }, [loading])
  useEffect(() => {
    if (!selectedDt) {
      const id = setInterval(refetch, 60_000)
      return () => clearInterval(id)
    }
  }, [selectedDt, refetch])

  const retroCount   = data?.planets.filter(p => p.retrograde).length ?? 0
  const visibleCount = data?.planets.filter(p => p.visible).length    ?? 0
  const stars        = data?.stars        ?? []
  const conjunctions = data?.conjunctions ?? []
  const meta         = data?.meta         ?? {}

  return (
    <div className="min-h-screen text-slate-100 overflow-x-hidden font-readout" style={{ background: "var(--bg-page)", transition: "background 0.8s ease" }}>
      <div className="fixed inset-0 pointer-events-none select-none"><StarField /></div>
      {(seeking || loading) && data && !isPlaying && <LoadingBar />}

      <header className="relative z-10 border-b border-cyan-900/30 backdrop-blur-sm" style={{ background: "var(--bg-header)", transition: "background 0.8s ease" }}>
        <div className="max-w-7xl mx-auto px-5 py-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-[0.18em] text-white font-display"
                style={{ textShadow: '0 0 16px rgba(0,110,170,0.22)' }}>CHRONOS OBSERVATORY</h1>
              <p className="text-[9px] tracking-[0.45em] text-slate-600 mt-0.5 uppercase">Planetary Telemetry · Swiss Ephemeris Engine</p>
            </div>
            <div className="text-right">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginBottom: '4px' }}>
                {['auto','day','dusk','night'].map(m => (
                  <button key={m} onClick={() => setLightMode(m)}
                    style={{
                      fontFamily: 'monospace', fontSize: '7px', letterSpacing: '0.15em',
                      padding: '2px 5px',
                      background: lightMode === m ? 'rgba(180,210,240,0.10)' : 'transparent',
                      border: lightMode === m ? '1px solid rgba(180,210,240,0.22)' : '1px solid transparent',
                      borderRadius: '2px',
                      color: lightMode === m ? 'rgba(200,220,245,0.80)' : 'rgba(100,130,165,0.40)',
                      cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.25s',
                    }}>{m}</button>
                ))}
              </div>
              <LiveClock />
              {!selectedDt && (
                <div className="flex items-center gap-1.5 justify-end mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
                  <span className="text-[9px] text-green-400 tracking-[0.3em]">LIVE</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-[9px] tracking-[0.25em] text-slate-600 uppercase">
            <span>Backend: <span className={error ? 'text-red-400' : 'text-green-400'}>{error ? 'ERROR' : 'ONLINE'}</span></span>
            <span>Bodies: <span className="text-cyan-400">{data?.planets.length ?? '—'}</span></span>
            <span>Visible: <span className="text-green-400">{visibleCount || '—'}</span></span>
            <span>Retrograde: <span className={retroCount > 0 ? 'text-red-400' : 'text-slate-500'}>{retroCount}</span></span>
            {stars.length > 0 && <span>Stars: <span className="text-amber-400/70">{stars.length}</span></span>}
            {conjunctions.length > 0 && <span>Contacts: <span className="text-amber-300/60">{conjunctions.length}</span></span>}
            {data && <span>JD: <span className="text-cyan-400">{data.julian_day}</span></span>}
            {data?.observer && (
              <span>Observer: <span className="text-cyan-400">
                {data.observer.lat.toFixed(2)}°N {Math.abs(data.observer.lon).toFixed(2)}°{data.observer.lon >= 0 ? 'E' : 'W'}
              </span></span>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-5 py-8 space-y-6">
        {!data && loading && (
          <div className="flex items-center justify-center py-32">
            <div className="text-center space-y-3">
              <div className="text-[10px] tracking-[0.45em] text-cyan-400 animate-pulse uppercase"
                style={{ fontFamily: 'Orbitron, monospace' }}>Acquiring Telemetry…</div>
              <div className="w-52 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto animate-pulse"/>
            </div>
          </div>
        )}

        {error && !loading && !data && (
          <div className="p-8 rounded text-center max-w-md mx-auto"
            style={{ border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(127,29,29,0.12)' }}>
            <div className="text-red-400 text-sm tracking-[0.3em] mb-2 uppercase font-display">Telemetry Error</div>
            <div className="text-red-300/70 text-xs font-mono">{error}</div>
            <button onClick={refetch} className="mt-5 px-5 py-1.5 text-[10px] rounded tracking-[0.25em] uppercase transition-colors"
              style={{ border: '1px solid rgba(239,68,68,0.4)', color: '#f87171' }}>Retry</button>
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-center">
              <div>
                <SystemsDropdown showPlanets={showPlanets} showStars={showStars} onTogglePlanets={() => setShowPlanets(v => !v)} onToggleStars={() => setShowStars(v => !v)}/>
                <ZodiacWheel planets={data.planets} angles={data.angles ?? null} stars={stars} conjunctions={conjunctions} showPlanets={showPlanets} showStars={showStars}/>
              </div>
              <VisibleSkyMap planets={data.planets} angles={data.angles ?? null}/>
            </div>

            <TimelineSlider value={selectedDt} onChange={setSelectedDt} onSeek={setSeeking} onPlayChange={setIsPlaying}/>

            <FixedStarContacts conjunctions={conjunctions} ayanamsha={meta.ayanamsha} ayanamsha_value={meta.ayanamsha_value}/>
            <TelemetryPanel planets={data.planets}/>
          </>
        )}

        <div className="pt-4 border-t border-cyan-900/15 text-center text-[8px] text-slate-800 tracking-[0.4em] uppercase">
          Chronos Observatory · Swiss Ephemeris · FastAPI + React + Tailwind
        </div>
      </main>
    </div>
  )
}
