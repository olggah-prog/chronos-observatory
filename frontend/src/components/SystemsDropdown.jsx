import { useState, useEffect, useRef } from 'react'

const ACTIVE = ['Planets', 'Fixed Stars']

const ANCIENT = ['Egyptian', 'Maya', 'Chinese', 'Jyotisha', 'Babylonian', 'Kabbalah', 'Arabic Cycles', 'Celtic']

const EXPERIMENTAL = ['Synchro', 'Resonance', 'Parans']

export default function SystemsDropdown() {
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
          padding: '0',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: '8px',
          letterSpacing: '0.30em',
          color: open ? 'rgba(200,212,230,0.60)' : 'rgba(160,175,200,0.38)',
          textTransform: 'uppercase',
          transition: 'color 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
        SIDEREAL SYMBOLIC SKY
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
          {/* Active */}
          <div style={{ marginBottom: '14px' }}>
            {ACTIVE.map(name => (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                marginBottom: '6px',
                fontFamily: 'monospace',
                fontSize: '9px',
                letterSpacing: '0.12em',
                color: 'rgba(215,225,238,0.82)',
                cursor: 'default',
              }}>
                <span style={{ color: 'rgba(100,200,140,0.75)', fontSize: '8px' }}>✓</span>
                {name}
              </div>
            ))}
          </div>

          <Divider label="Ancient Systems" />

          <div style={{ marginBottom: '14px' }}>
            {ANCIENT.map(name => (
              <Row key={name} name={name} />
            ))}
          </div>

          <Divider label="Experimental" />

          <div>
            {EXPERIMENTAL.map(name => (
              <Row key={name} name={name} />
            ))}
          </div>
        </div>
      )}
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
