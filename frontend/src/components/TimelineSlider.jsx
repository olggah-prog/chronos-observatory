import { useState, useRef, useEffect } from 'react'

const API_DEBOUNCE_MS  = 100
const PLAY_INTERVAL_MS = 400

// Scale presets: label, step (hours), past range, future range
const SCALES = [
  { label: '1H',  step: 1,   past: 24,    future: 6    },
  { label: '3H',  step: 3,   past: 72,    future: 12   },
  { label: '6H',  step: 6,   past: 144,   future: 24   },
  { label: '12H', step: 12,  past: 360,   future: 48   },
  { label: '24H', step: 24,  past: 8760,  future: 720  },
]

function addHours(base, hours) {
  const d = new Date(base)
  d.setTime(d.getTime() + hours * 3600_000)
  return d
}

function toIso(date) {
  return date.toISOString().slice(0, 19)
}

function formatLabel(offsetHours, today) {
  if (offsetHours === 0) return 'NOW — LIVE FEED'
  const d = addHours(today, offsetHours)
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  }) + ' ' + String(d.getUTCHours()).padStart(2, '0') + ':' +
  String(d.getUTCMinutes()).padStart(2, '0') + ' UTC'
}

function formatTick(offsetHours, past, label) {
  if (label === '24H') {
    const d = Math.round(Math.abs(offsetHours) / 24)
    return offsetHours < 0 ? `−${d}d` : offsetHours > 0 ? `+${d}d` : 'TODAY'
  }
  if (Math.abs(offsetHours) >= 24) {
    return (offsetHours < 0 ? '−' : '+') + Math.round(Math.abs(offsetHours) / 24) + 'd'
  }
  return (offsetHours < 0 ? '−' : '+') + Math.abs(offsetHours) + 'h'
}

export default function TimelineSlider({ value, onChange, onSeek, onPlayChange }) {
  const [offsetHours, setOffsetHours] = useState(0)
  const [playing, setPlaying]         = useState(false)
  const [scaleIdx, setScaleIdx]       = useState(4) // default 24H

  const scale       = SCALES[scaleIdx]
  const todayRef    = useRef(new Date())
  const playRef     = useRef(null)
  const debounceRef = useRef(null)

  function fireChange(hours) {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (hours === 0) onChange('')
      else onChange(toIso(addHours(todayRef.current, hours)))
    }, API_DEBOUNCE_MS)
  }

  function handleSlider(e) {
    const hours = parseInt(e.target.value, 10)
    setOffsetHours(hours)
    onSeek?.(true)
    fireChange(hours)
  }

  function handleNow() {
    clearInterval(playRef.current)
    clearTimeout(debounceRef.current)
    setPlaying(false)
    onPlayChange?.(false)
    setOffsetHours(0)
    onChange('')
  }

  function handleScale(idx) {
    clearInterval(playRef.current)
    setPlaying(false)
    onPlayChange?.(false)
    setScaleIdx(idx)
    // clamp current offset to new range
    const s = SCALES[idx]
    setOffsetHours(h => {
      const clamped = Math.max(-s.past, Math.min(s.future, h))
      fireChange(clamped)
      return clamped
    })
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
      setOffsetHours(prev => {
        const next = prev >= scale.future ? -scale.past : prev + scale.step
        if (next === 0) onChange('')
        else onChange(toIso(addHours(todayRef.current, next)))
        return next
      })
    }, PLAY_INTERVAL_MS)
  }

  useEffect(() => () => {
    clearInterval(playRef.current)
    clearTimeout(debounceRef.current)
  }, [])

  const past   = scale.past
  const future = scale.future

  return (
    <div className="p-5 rounded" style={{
      background: 'rgba(5,14,26,0.7)',
      border: '1px solid rgba(180,210,240,0.10)',
      boxShadow: '0 0 24px rgba(100,150,200,0.06)',
    }}>
      {/* Row 1: label + scale buttons + play/now */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
        <span className="text-[9px] tracking-[0.35em] text-slate-600 uppercase" style={{ flexShrink: 0 }}>
          Temporal Navigation
        </span>
        {/* Scale selector */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {SCALES.map((s, i) => (
            <button key={s.label} onClick={() => handleScale(i)}
              className="text-[8px] px-2 py-1 rounded tracking-[0.15em] border transition-colors"
              style={i === scaleIdx
                ? { borderColor: 'rgba(100,180,240,0.5)', color: 'rgba(140,210,255,0.9)', background: 'rgba(100,180,240,0.10)' }
                : { borderColor: 'rgba(100,140,180,0.15)', color: 'rgba(120,150,180,0.45)', background: 'transparent' }
              }>
              {s.label}
            </button>
          ))}
        </div>
        {/* Play / Now */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
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
      </div>

      {/* Row 2: current time label */}
      <div style={{
        fontFamily: 'Orbitron, monospace',
        fontSize: '13px',
        letterSpacing: '0.05em',
        fontWeight: 'bold',
        color: offsetHours === 0 ? 'rgba(180,220,200,0.85)' : 'rgba(180,210,240,0.80)',
        marginBottom: '12px',
        minHeight: '20px',
      }}>
        {formatLabel(offsetHours, todayRef.current)}
      </div>

      {/* Slider */}
      <input type="range"
        min={-past} max={future} step={scale.step}
        value={offsetHours}
        onInput={handleSlider} onChange={handleSlider}
        className="w-full"/>

      {/* Scale ticks */}
      <div className="flex justify-between mt-1.5 text-[8px] text-slate-700 tracking-widest select-none">
        <span>{formatTick(-past, past, scale.label)}</span>
        <span>{formatTick(-Math.round(past / 2), past, scale.label)}</span>
        <span style={{ color: offsetHours === 0 ? 'rgba(150,210,185,0.70)' : '#334155' }}>NOW</span>
        <span>{formatTick(future, past, scale.label)}</span>
      </div>
    </div>
  )
}
