import React from 'react'
const PLANET_SYMBOL = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
  NNode: '☊', SNode: '☋',
}

export default function FixedStarContacts({ conjunctions = [], ayanamsha = '', ayanamsha_value = null }) {
  const [open, setOpen] = React.useState(false)
  const empty = !conjunctions || conjunctions.length === 0
  const count = conjunctions?.length ?? 0
  return (
    <div style={{ border: '1px solid rgba(14,165,233,0.18)', background: 'rgba(5,14,26,0.55)', borderRadius: '4px', padding: '12px 20px', minHeight: 'auto' }}>
      <div className="flex items-center justify-between mb-3 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}>
        <span className="text-[9px] tracking-[0.4em] text-slate-600 uppercase">
          Stars {count > 0 && <span className="text-amber-400/60 ml-1">{count}</span>}
        </span>
        <div className="flex items-center gap-3">
          {ayanamsha && ayanamsha_value != null && (
            <span className="text-[8px] tracking-[0.2em] text-slate-700 uppercase font-mono">
              {ayanamsha} · {ayanamsha_value.toFixed(4)}°
            </span>
          )}
          <span className="text-[8px] text-slate-700">{open ? '▲' : '▼'}</span>
        </div>
      </div>
      <div className="grid gap-2 pb-1 mb-1" style={{ gridTemplateColumns: '24px 1fr 1fr 52px 80px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {['', 'Planet', 'Star', 'Orb', 'Mode'].map((h, i) => (
          <span key={i} className="text-[8px] tracking-[0.25em] text-slate-700 uppercase">{h}</span>
        ))}
      </div>
      {open && (empty ? (
        <div style={{ color: "rgba(100,120,150,0.35)", fontSize: "9px", letterSpacing: "0.2em", fontFamily: "monospace", paddingTop: "8px" }}>NO ACTIVE CONTACTS</div>
      ) : (
      <div className="space-y-0.5" style={{ maxHeight: "200px", overflowY: "auto" }}>
        {conjunctions.map((c, i) => {
          const applying = c.applying === true
          return (
            <div key={i} className="grid gap-2 items-center py-[3px]"
              style={{ gridTemplateColumns: '24px 1fr 1fr 52px 80px', borderBottom: '1px solid rgba(255,255,255,0.025)', opacity: c.orb > 1.5 ? 0.55 : 1 }}>
              <span className="text-[9px] text-amber-300/50" style={{ fontFamily: 'serif' }}>✦</span>
              <span className="text-[10px] text-slate-300 tracking-wide flex items-center gap-1">
                <span style={{ fontFamily: 'serif' }} className="text-slate-400 text-[11px]">{PLANET_SYMBOL[c.planet] ?? ''}</span>
                {c.planet}
              </span>
              <span className="text-[10px] text-amber-200/65 tracking-wide">{c.star}</span>
              <span className="text-[10px] font-mono text-slate-500">{c.orb != null ? `${c.orb.toFixed(2)}°` : '—'}</span>
              <span className="text-[8px] tracking-[0.15em] uppercase" style={{ color: applying ? 'rgba(74,222,128,0.65)' : 'rgba(148,163,184,0.38)' }}>
                {applying ? '▶ appl' : '◀ sep'}
              </span>
            </div>
          )
        })}
      </div>
      ))}
    </div>
  )
}
