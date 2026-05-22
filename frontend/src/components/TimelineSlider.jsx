import { useState, useRef, useEffect } from 'react'

const PAST_DAYS        = 365
const FUTURE_DAYS      = 30
const DRAG_DEBOUNCE_MS = 200   // fire API call this long after the user pauses
const PLAY_INTERVAL_MS = 320   // step interval during animation playback

function offsetDate(base, days) {
  const d = new Date(base)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function toIso(date) {
  return date.toISOString().slice(0, 19)
}

// Derive the display label directly from the local offset integer so it updates
// on every drag event without waiting for the parent's `value` prop to sync.
function labelFromOffset(offset, today) {
  if (offset === 0) return 'NOW  —  LIVE FEED'
  const d = offsetDate(today, offset)
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    timeZone: 'UTC',
  }) + ' UTC'
}

// onSeek(true)  — called the instant the user starts/continues dragging
// onSeek(false) — not called here; App resets seeking when loading starts
export default function TimelineSlider({ value, onChange, onSeek }) {
  // `offset` is local UI state — slider position is NEVER reset by incoming `value` prop.
  // Only explicit user actions (handleNow, togglePlay) mutate it.
  const [offset, setOffset]   = useState(0)
  const [playing, setPlaying] = useState(false)

  const todayRef    = useRef(new Date())
  const playRef     = useRef(null)
  const debounceRef = useRef(null)

  // Commit an offset to the parent (debounced for drag, immediate for buttons)
  function commit(days, immediate = false) {
    clearTimeout(debounceRef.current)
    const fire = () => {
      if (days === 0) onChange('')
      else onChange(toIso(offsetDate(todayRef.current, days)))
    }
    if (immediate) {
      fire()
    } else {
      debounceRef.current = setTimeout(fire, DRAG_DEBOUNCE_MS)
    }
  }

  function handleSlider(e) {
    const days = parseInt(e.target.value, 10)
    setOffset(days)        // immediate — label and track update on every pixel
    onSeek?.(true)         // tell parent to show loading indicator right away
    commit(days)           // debounced — API call fires only after pause
  }

  function handleNow() {
    clearInterval(playRef.current)
    clearTimeout(debounceRef.current)
    setPlaying(false)
    setOffset(0)
    onChange('')           // immediate
  }

  function togglePlay() {
    if (playing) {
      clearInterval(playRef.current)
      setPlaying(false)
      return
    }
    setPlaying(true)
    playRef.current = setInterval(() => {
      setOffset(prev => {
        const next = prev >= FUTURE_DAYS ? -PAST_DAYS : prev + 1
        // Play fires at a controlled cadence — no debounce needed here
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

  const pct = ((offset + PAST_DAYS) / (PAST_DAYS + FUTURE_DAYS)) * 100

  return (
    <div
      className="p-5 rounded"
      style={{
        background: 'rgba(5,14,26,0.7)',
        border: '1px solid rgba(180,210,240,0.10)',
        boxShadow: '0 0 24px rgba(100,150,200,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <span className="text-[9px] tracking-[0.35em] text-slate-600 uppercase">
          Temporal Navigation
        </span>

        <span
          className="text-[13px] tracking-widest font-bold tabular-nums"
          style={{
            fontFamily: 'Orbitron, monospace',
            // Colour derived from local offset — updates instantly, no debounce lag
            color:      offset === 0 ? 'rgba(180,220,200,0.85)' : 'rgba(180,210,240,0.80)',
            textShadow: offset === 0
              ? '0 0 10px rgba(120,200,160,0.25)'
              : '0 0 10px rgba(140,190,230,0.22)',
          }}
        >
          {labelFromOffset(offset, todayRef.current)}
        </span>

        <div className="flex gap-2">
          <button
            onClick={togglePlay}
            className="text-[9px] px-3 py-1.5 rounded tracking-[0.2em] border transition-colors"
            style={playing
              ? { borderColor: 'rgba(239,68,68,0.5)', color: '#f87171', background: 'rgba(239,68,68,0.08)' }
              : { borderColor: 'rgba(140,180,220,0.25)', color: 'rgba(170,205,235,0.65)', background: 'transparent' }
            }
          >
            {playing ? '■ STOP' : '▶ PLAY'}
          </button>
          <button
            onClick={handleNow}
            className="text-[9px] px-3 py-1.5 rounded tracking-[0.2em] border transition-colors"
            style={{ borderColor: 'rgba(120,190,160,0.25)', color: 'rgba(150,210,185,0.65)', background: 'transparent' }}
          >
            ◉ NOW
          </button>
        </div>
      </div>

      {/* Track + thumb */}
      <div className="relative">

        <input
          type="range"
          min={-PAST_DAYS}
          max={FUTURE_DAYS}
          value={offset}
          onInput={handleSlider}
          onChange={handleSlider}
          className="w-full"
        />
      </div>

      {/* Scale ticks */}
      <div className="flex justify-between mt-1.5 text-[8px] text-slate-700 tracking-widest select-none">
        <span>−{PAST_DAYS}d</span>
        <span>−{Math.round(PAST_DAYS / 2)}d</span>
        <span style={{ color: offset === 0 ? 'rgba(150,210,185,0.70)' : '#334155' }} className="transition-colors">
          TODAY
        </span>
        <span>+{FUTURE_DAYS}d</span>
      </div>
    </div>
  )
}
