// Atmospheric Engine v0.1 — architecture only, no visual tuning yet

export default function AtmosphericLayers({ skyMode }) {
  return (
    <div className="atmospheric-layers" style={{
      position: 'fixed', inset: 0,
      pointerEvents: 'none',
      zIndex: 1,
    }}>

      {/* Layer 1: Sky gradient */}
      <div className="atm-sky-gradient" style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, var(--sky-top), var(--sky-bottom))',
        opacity: 0.6,
      }}/>

      {/* Layer 2: Haze */}
      <div className="atm-haze" style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 80%, var(--haze-color), transparent 70%)',
        opacity: 0.7,
      }}/>

      {/* Layer 3: Horizon glow */}
      <div className="atm-horizon-glow" style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '35%',
        background: 'linear-gradient(to top, var(--horizon-glow), transparent)',
        opacity: 0.8,
      }}/>

    </div>
  )
}
