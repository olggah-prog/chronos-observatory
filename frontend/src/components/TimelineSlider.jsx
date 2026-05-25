import { useState, useRef, useEffect, useCallback } from 'react'

const PLAY_INTERVAL_MS = 400
const DRAG_THROTTLE_MS = 600  // API call only after 600ms pause while dragging

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

function formatTick(offsetHours, scale) {
  if (scale.label === '24H') {
    const d = Math.round(Math.abs(offsetHours) / 24)
    return offsetHours < 0 ? `−${d}d` : offsetHours > 0 ? `+${d}d` : 'NOW'
  }
  if (Math.abs(offsetHours) >= 24)
    return (offsetHours < 0 ? '−' : '+') + Math.round(Math.abs(offsetHours) / 24) + 'd'
  return (offsetHours < 0 ? '−' : '+') + Math.abs(offsetHours) + 'h'
}

export default function TimelineSlider({ value, onChange, onSeekDt, onSeek, onPlayChange }) {
  const [offsetHours, setOffsetHours] = useState(0)
  const [playing, setPlaying]         = useState(false)
  const [isDragging, setIsDragging]   = useState(false)
  const [scaleIdx, setScaleIdx]       = useState(4)

  const scale        = SCALES[scaleIdx]
  const todayRef     = useRef(new Date())
  const playRef      = useRef(null)
  const throttleRef  = useRef(null)
  const rafRef       = useRef(null)
  const pendingHours = useRef(0)

  // Commit to API — called after drag ends or throttle fires
  const commitChange = useCallback((hours) => {
    if (hours === 0) onChange('')
    else onChange(toIso(addHours(todayRef.current, hours)))
  }, [onChange])

  // During drag: update label instantly via rAF, throttle API
  const handleSlider = useCallback((e) => {
    const hours = parseInt(e.target.value, 10)
    pendingHours.current = hours

    // Instant visual update via rAF
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      setOffsetHours(hours)
      const iso = hours === 0 ? '' : toIso(addHours(todayRef.current, hours))
      onSeekDt?.(iso)
    })

    // Throttled API call
    clearTimeout(throttleRef.current)
    throttleRef.current = setTimeout(() => {
      commitChange(hours)
    }, DRAG_THROTTLE_MS)
  }, [commitChange])

  // On pointer up — commit immediately without waiting for throttle
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    clearTimeout(throttleRef.current)
    commitChange(pendingHours.current)
    onSeek?.(false)
  }, [isDragging, commitChange, onSeek])

  const handlePointerDown = useCallback(() => {
    setIsDragging(true)
    onSeek?.(true)
  }, [onSeek])

  function handleNow() {
    clearInterval(playRef.current)
    clearTimeout(throttleRef.current)
    cancelAnimationFrame(rafRef.current)
    setPlaying(false)
    onPlayChange?.(false)
    setOffsetHours(0)
    pendingHours.current = 0
    onChange('')
  }

  function handleScale(idx) {
    clearInterval(playRef.current)
    setPlaying(false)
    onPlayChange?.(false)
    setScaleIdx(idx)
    const s = SCALES[idx]
    setOffsetHours(h => {
      const clamped = Math.max(-s.past, Math.min(s.future, h))
      commitChange(clamped)
      pendingHours.current = clamped
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
        pendingHours.current = next
        if (next === 0) onChange('')
        else onChange(toIso(addHours(todayRef.current, next)))
        return next
      })
    }, PLAY_INTERVAL_MS)
  }

  useEffect(() => () => {
    clearInterval(playRef.current)
    clearTimeout(throttleRef.current)
    cancelAnimationFrame(rafRef.current)
  }, [])

  const past   = scale.past
  const future = scale.future

  return (
    <div className="p-5 rounded" style={{
      background: 'transparent',
    }}>
      {/* Time label — only show when not NOW */}
      <div style={{
        fontFamily: 'Orbitron, monospace',
        fontSize: '11px',
        letterSpacing: '0.05em',
        fontWeight: 'bold',
        minHeight: '20px',
        marginBottom: '6px',
        color: isDragging ? 'rgba(200,220,255,0.95)' : 'rgba(180,210,240,0.80)',
        transition: 'color 0.15s ease',
        visibility: offsetHours === 0 ? 'hidden' : 'visible',
      }}>
        {formatLabel(offsetHours, todayRef.current)}
        {isDragging && <span style={{ fontSize: '8px', marginLeft: '8px', color: 'rgba(100,160,220,0.5)', letterSpacing: '0.2em' }}>SCRUBBING</span>}
      </div>

      {/* Slider */}
      <input type="range"
        min={-past} max={future} step={scale.step}
        value={offsetHours}
        onInput={handleSlider}
        onChange={handleSlider}
        onPointerDown={handlePointerDown}
        onPointerUp={handleDragEnd}
        onPointerLeave={handleDragEnd}
        className="w-full"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      />

      {/* Ticks */}
      <div className="flex justify-between mt-1.5 text-[8px] text-slate-700 tracking-widest select-none">
        <span>{formatTick(-past, scale)}</span>
        <span>{formatTick(-Math.round(past / 2), scale)}</span>
        <span style={{ color: offsetHours === 0 ? 'rgba(150,210,185,0.70)' : '#334155' }}>NOW</span>
        <span>{formatTick(future, scale)}</span>
      </div>

      {/* Controls below slider */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
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
    </div>
  )
}
