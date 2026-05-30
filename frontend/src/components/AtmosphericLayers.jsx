// Atmospheric Engine v0.2

export default function AtmosphericLayers({ skyMode }) {
  return (
    <div className="atmospheric-layers" style={{
      position: 'fixed', inset: 0,
      pointerEvents: 'none',
      zIndex: 1,
      transition: 'opacity 2s ease',
    }}>

      {/* Layer 1: Sky gradient — shifts base color by mode */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, var(--sky-top) 0%, var(--sky-bottom) 100%)',
        opacity: 'var(--atm-opacity)',
        transition: 'opacity 3s ease',
      }}/>

      {/* Layer 2: Atmospheric haze — soft radial from horizon */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 120% 60% at 50% 100%, var(--haze-color), transparent 70%)',
        opacity: 1,
      }}/>

      {/* Layer 3: Horizon glow — warm or cool depending on mode */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '40%',
        background: 'linear-gradient(to top, var(--horizon-glow) 0%, transparent 100%)',
        opacity: 1,
      }}/>

    </div>
  )
}
