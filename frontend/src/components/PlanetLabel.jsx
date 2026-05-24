import { useState, useCallback } from 'react'

// Museum-style observatory label
// Appears near tapped/hovered planet, fades in, dismisses on tap-away
export default function PlanetLabel({ planet, conjunctions = [], pos, svgRect, onClose }) {
  if (!planet || !pos || !svgRect) return null

  // Convert SVG coords to screen coords
  const scaleX = svgRect.width / 672   // viewBox is -36 -36 672 672
  const scaleY = svgRect.height / 672
  const screenX = (pos.x + 36) * scaleX + svgRect.left
  const screenY = (pos.y + 36) * scaleY + svgRect.top

  // Find conjunctions for this planet
  const conjs = conjunctions.filter(c => c.planet === planet.name && c.orb <= 2.0)

  // Position: prefer right, flip if too close to edge
  const labelW = 140
  const margin = 12
  let left = screenX + margin
  if (left + labelW > svgRect.right - 8) left = screenX - labelW - margin

  const lines = [
    planet.name.toUpperCase(),
    planet.zodiac_sign ? planet.zodiac_sign : null,
    planet.longitude != null ? `${planet.longitude.toFixed(1)}°` : null,
    planet.altitude != null ? `Alt ${planet.altitude > 0 ? '+' : ''}${planet.altitude.toFixed(0)}°` : null,
    planet.azimuth != null ? `Az ${planet.azimuth.toFixed(0)}°` : null,
    planet.retrograde ? 'Retrograde ℞' : null,
    planet.illumination_pct != null ? `${planet.illumination_pct.toFixed(0)}% lit` : null,
    planet.morning_star === true ? 'Morning Star' : planet.morning_star === false ? 'Evening Star' : null,
    ...conjs.map(c => `Conj. ${c.star} ${c.orb.toFixed(1)}°`),
  ].filter(Boolean)

  return (
    <>
      {/* Backdrop to dismiss on tap-away */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 49,
        background: 'transparent',
      }}/>
      <div style={{
        position: 'fixed',
        left: Math.max(8, left),
        top: Math.max(8, screenY - 20),
        zIndex: 50,
        background: 'rgba(3,9,18,0.88)',
        border: '1px solid rgba(200,215,235,0.12)',
        borderRadius: '2px',
        padding: '8px 12px',
        fontFamily: 'monospace',
        fontSize: '9px',
        letterSpacing: '0.12em',
        color: 'rgba(200,215,235,0.75)',
        lineHeight: '1.8',
        pointerEvents: 'none',
        animation: 'fadeIn 0.15s ease',
        backdropFilter: 'blur(8px)',
        minWidth: '120px',
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            color: i === 0 ? 'rgba(220,228,240,0.92)' : 'rgba(170,188,210,0.62)',
            fontWeight: i === 0 ? 'bold' : 'normal',
            letterSpacing: i === 0 ? '0.18em' : '0.10em',
          }}>{line}</div>
        ))}
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(3px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </>
  )
}
