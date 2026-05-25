import { useState, useEffect, useMemo } from 'react'
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
  const [cityName,    setCityName]    = useState('')


  const { data: rawData, loading, error, refetch } = useSkyData(selectedDt)
  const data = useInterpolatedSky(rawData)

  useEffect(() => {
    if (!data?.observer || cityName) return
    const { lat, lon } = data.observer
    fetch('https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lon + '&format=json', { headers: { 'Accept-Language': 'en', 'User-Agent': 'ChronosObservatory/1.0' } })
      .then(r => r.json())
      .then(d => {
        const city = d.address?.city || d.address?.town || d.address?.village || ''
        if (city) setCityName(city.toUpperCase())
      })
      .catch(() => {})
  }, [data])

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
    <div className="min-h-screen bg-[#020812] text-slate-100 overflow-x-hidden font-readout">
      <div className="fixed inset-0 pointer-events-none select-none"><StarField /></div>
      {(seeking || loading) && data && !isPlaying && <LoadingBar />}

      <header className="relative z-10 border-b border-cyan-900/30 bg-[#020812]/85 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-5 py-2">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-[0.18em] text-white font-display"
                style={{ textShadow: '0 0 16px rgba(0,110,170,0.22)' }}>CHRONOS OBSERVATORY</h1>
              <p className="text-[9px] tracking-[0.45em] text-slate-600 mt-0.5 uppercase">Planetary Telemetry · Swiss Ephemeris Engine</p>
            </div>
            <div className="text-right">
              <LiveClock />
              {!selectedDt && (
                <div className="flex items-center gap-1.5 justify-end mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
                  <span className="text-[9px] text-green-400 tracking-[0.3em]">LIVE</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-5 pt-0 pb-0 space-y-0">
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
              <SystemsDropdown observer={data?.observer ?? null} cityName={cityName} showPlanets={showPlanets} showStars={showStars} onTogglePlanets={() => setShowPlanets(v => !v)} onToggleStars={() => setShowStars(v => !v)}/>
              <div className="grid grid-cols-1 xl:grid-cols-2 items-center" style={{ gap: "48px", gridTemplateColumns: "minmax(420px, 500px) minmax(0, 1fr)", justifyItems: "stretch", alignItems: "center" }}>
                <ZodiacWheel planets={data.planets} angles={data.angles ?? null} stars={stars} conjunctions={conjunctions} showPlanets={showPlanets} showStars={showStars}/>
                <VisibleSkyMap planets={data.planets} angles={data.angles ?? null}/>
              </div>
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
