import { useState, useRef, useEffect } from 'react'

const PAST_DAYS        = 365
const FUTURE_DAYS      = 30
const API_DEBOUNCE_MS  = 100
const PLAY_INTERVAL_MS = 400

function offsetDate(base, days) {
  const d = new Date(base)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function toIso(date) {
  return date.toISOString().slice(0, 19)
}

function labelFromOffset(offset, today) {
  if (offset === 0) return 'NOW  —  LIVE FEED'
  const d = offsetDate(today, offset)
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    timeZone: 'UTC',
  }) + ' UTC'
}

export default function TimelineSlider({ value, onChange, onSeek, onPlayChange }) {
  const [offset, setOffset]   = useState(0)
  const [playing, setPlaying] = useState(false)

  const todayRef    = useRef(new Date())
  const playRef     = useRef(null)
  const debounceRef = useRef(null)

  function fireChange(days) {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (days === 0) onChange('')
      else onChange(toIso(offsetDate(todayRef.current, days)))
    }, API_DEBOUNCE_MS)
  }

  function handleSlider(e) {
    const days = parseInt(e.target.value, 10)
    setOffset(days)
    onSeek?.(true)
    fireChange(days)
  }

  function handleNow() {
    clearInterval(playRef.current)
    clearTimeout(debounceRef.current)
    setPlaying(false)
    onPlayChange?.(false)
    setOffset(0)
    onChange('')
  }

  function togglePlay() {
    if (playing) {
      clearInterval(playRef.current)
      setPlaying(false)
      onPlayChange?.(false)
      return
    }
    setPlaying(true)
    onPlayChange?.(true)
    playRef.current = setInterval(() => {
      setOffset(prev => {
        const next = prev >= FUTURE_DAYS ? -PAST_DAYS : prev + 1
        if (next === 0) onChange('')
        else onChange(toIso(offsetDate(todayRef.current, next)))
        return next
      })
    }, PLAY_INTERVAL_MS)
  }

  useEffect(() => () => {
    clearInterval(playRef.current)
    clearTimeout(debounceRef.current)
  }, [])

  return (
    <div className="p-5 rounded" style={{
      background: 'rgba(5,14,26,0.7)',
      border: '1px solid rgba(180,210,240,0.10)',
      boxShadow: '0 0 24px rgba(100,150,200,0.06)',
    }}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] tracking-[0.35em] text-slate-600 uppercase">Temporal Navigation</span>
          <div className="flex gap-2">
          <button onClick={togglePlay}
            className="text-[9px] px-3 py-1.5 rounded tracking-[0.2em] border transition-colors"
            style={playing
              ? { borderColor: 'rgba(239,68,68,0.5)', color: '#f87171', background: 'rgba(239,68,68,0.08)' }
              : { borderColor: 'rgba(140,180,220,0.25)', color: 'rgba(170,205,235,0.65)', background: 'transparent' }
            }>
            {playing ? '■ STOP' : '▶ PLAY'}
          </button>
          <button onClick={handleNow}
            className="text-[9px] px-3 py-1.5 rounded tracking-[0.2em] border transition-colors"
            style={{ borderColor: 'rgba(120,190,160,0.25)', color: 'rgba(150,210,185,0.65)', background: 'transparent' }}>
            ◉ NOW
          </button>
        </div>
        <div className="text-[13px] tracking-widest font-bold tabular-nums mt-2" style={{
          fontFamily: 'Orbitron, monospace',
          color: offset === 0 ? 'rgba(180,220,200,0.85)' : 'rgba(180,210,240,0.80)',
          textShadow: offset === 0 ? '0 0 10px rgba(120,200,160,0.25)' : '0 0 10px rgba(140,190,230,0.22)',
        }}>
          {labelFromOffset(offset, todayRef.current)}
        </div>
      </div>
    </div>
    <div>
      <input type="range" min={-PAST_DAYS} max={FUTURE_DAYS}
          value={offset} onInput={handleSlider} onChange={handleSlider}
          className="w-full"/>
      </div>
      <div className="flex justify-between mt-1.5 text-[8px] text-slate-700 tracking-widest select-none">
        <span>−{PAST_DAYS}d</span>
        <span>−{Math.round(PAST_DAYS / 2)}d</span>
        <span style={{ color: offset === 0 ? 'rgba(150,210,185,0.70)' : '#334155' }} className="transition-colors">TODAY</span>
        <span>+{FUTURE_DAYS}d</span>
      </div>
    </div>
  )
}
