import { useState, useEffect, useRef } from 'react'

const ANCIENT = ['Egyptian', 'Maya', 'Chinese', 'Jyotisha', 'Babylonian', 'Kabbalah', 'Arabic Cycles', 'Celtic']
const EXPERIMENTAL = ['Synchro', 'Resonance', 'Parans']

function ActiveRow({ label, on, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      marginBottom: '6px',
      fontFamily: 'monospace',
      fontSize: '9px',
      letterSpacing: '0.12em',
      color: on ? 'rgba(215,225,238,0.82)' : 'rgba(140,158,182,0.38)',
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'color 0.2s',
    }}>
      <span style={{
        color: on ? 'rgba(100,200,140,0.75)' : 'rgba(140,158,182,0.25)',
        fontSize: '8px',
        transition: 'color 0.2s',
      }}>{on ? '✓' : '○'}</span>
      {label}
    </div>
  )
}

function Divider({ label }) {
  return (
    <div style={{
      fontFamily: 'monospace',
      fontSize: '6.5px',
      letterSpacing: '0.18em',
      color: 'rgba(130,148,172,0.28)',
      fontStyle: 'italic',
      marginBottom: '8px',
    }}>— {label} —</div>
  )
}

function Row({ name }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      marginBottom: '5px',
      fontFamily: 'monospace',
      fontSize: '8.5px',
      letterSpacing: '0.10em',
      color: 'rgba(140,158,182,0.30)',
      cursor: 'default',
    }}>
      <span style={{ fontSize: '7px', opacity: 0.4 }}>○</span>
      {name}
    </div>
  )
}

export default function SystemsDropdown({ observer = null, cityName = '', showPlanets = true, showStars = true, onTogglePlanets, onToggleStars }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', marginBottom: '10px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: '9.5px',
          letterSpacing: '0.28em',
          color: open ? 'rgba(210,222,238,0.82)' : 'rgba(185,200,220,0.62)',
          textTransform: 'uppercase',
          transition: 'color 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 10px 4px 0',
          borderBottom: open ? '1px solid rgba(180,200,230,0.15)' : '1px solid transparent',
        }}>
        {observer ? (cityName || (observer.lat.toFixed(2) + (observer.lat >= 0 ? '°N' : '°S') + ' · ' + Math.abs(observer.lon).toFixed(2) + (observer.lon >= 0 ? '°E' : '°W'))) : 'SIDEREAL SYMBOLIC SKY'}
        <span style={{
          fontSize: '7px',
          opacity: 0.6,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          display: 'inline-block',
        }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: '0',
          zIndex: 100,
          background: 'rgba(4,10,20,0.92)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '2px',
          padding: '16px 20px 18px',
          minWidth: '180px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.55)',
        }}>
          <div style={{ marginBottom: '14px' }}>
            <ActiveRow label="Planets"     on={showPlanets} onToggle={onTogglePlanets}/>
            <ActiveRow label="Fixed Stars" on={showStars}   onToggle={onToggleStars}/>
          </div>

          <Divider label="Ancient Systems" />
          <div style={{ marginBottom: '14px' }}>
            {ANCIENT.map(name => <Row key={name} name={name}/>)}
          </div>

          <Divider label="Experimental" />
          <div>
            {EXPERIMENTAL.map(name => <Row key={name} name={name}/>)}
          </div>
        </div>
      )}
    </div>
  )
}
