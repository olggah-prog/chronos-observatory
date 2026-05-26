const ACTIVE = [
  { id: 'planets',     label: 'Planets',      active: true  },
  { id: 'fixedstars',  label: 'Stars',  active: true  },
]

const ANCIENT = [
  'Egyptian', 'Maya', 'Chinese', 'Jyotisha', 'Babylonian', 'Kabbalah', 'Arabic Cycles', 'Celtic',
]

const EXPERIMENTAL = [
  'Synchro', 'Resonance', 'Parans',
]

export default function LayerPanel() {
  return (
    <div style={{
      width: '160px',
      flexShrink: 0,
      paddingTop: '2px',
      fontFamily: 'monospace',
      userSelect: 'none',
    }}>
      <div style={{
        fontSize: '7px',
        letterSpacing: '0.22em',
        color: 'rgba(150,165,190,0.40)',
        marginBottom: '14px',
        textTransform: 'uppercase',
      }}>
        Cultural Sky Systems
      </div>

      {/* Active layers */}
      <div style={{ marginBottom: '16px' }}>
        {ACTIVE.map(l => (
          <div key={l.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            marginBottom: '6px',
            fontSize: '9px',
            letterSpacing: '0.12em',
            color: 'rgba(215,225,238,0.82)',
            cursor: 'default',
          }}>
            <span style={{ color: 'rgba(100,200,140,0.75)', fontSize: '8px' }}>✓</span>
            {l.label}
          </div>
        ))}
      </div>

      {/* Ancient Systems */}
      <div style={{
        fontSize: '7px',
        letterSpacing: '0.18em',
        color: 'rgba(130,148,172,0.30)',
        marginBottom: '8px',
        fontStyle: 'italic',
      }}>
        — Ancient Systems —
      </div>
      <div style={{ marginBottom: '16px' }}>
        {ANCIENT.map(name => (
          <div key={name} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            marginBottom: '5px',
            fontSize: '8.5px',
            letterSpacing: '0.10em',
            color: 'rgba(140,158,182,0.32)',
            cursor: 'default',
          }}>
            <span style={{ fontSize: '7px', opacity: 0.5 }}>○</span>
            {name}
          </div>
        ))}
      </div>

      {/* Experimental */}
      <div style={{
        fontSize: '7px',
        letterSpacing: '0.18em',
        color: 'rgba(130,148,172,0.30)',
        marginBottom: '8px',
        fontStyle: 'italic',
      }}>
        — Experimental —
      </div>
      <div>
        {EXPERIMENTAL.map(name => (
          <div key={name} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            marginBottom: '5px',
            fontSize: '8.5px',
            letterSpacing: '0.10em',
            color: 'rgba(140,158,182,0.25)',
            cursor: 'default',
          }}>
            <span style={{ fontSize: '7px', opacity: 0.4 }}>○</span>
            {name}
          </div>
        ))}
      </div>
    </div>
  )
}
