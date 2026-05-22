import { useState, useEffect, useRef, useCallback } from 'react'

const INTERP_MS = 900

function easeOut(t) {
  return 1 - Math.pow(1 - Math.min(t, 1), 3)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

// Azimuth-aware X interpolation: detects wraparound (359→0)
// and skips animation for that frame instead of dragging across screen
function lerpX(prevX, targetX, t, screenWidth) {
  const diff = Math.abs(targetX - prevX)
  // If jump is more than half screen width — it's a wraparound, snap instantly
  if (diff > screenWidth * 0.45) return targetX
  return lerp(prevX, targetX, t)
}

export function useInterpolatedBodies(rawBodies, screenWidth = 900) {
  const displayedRef  = useRef(null)
  const prevXYRef     = useRef({})
  const [displayed, setDisplayed] = useState(rawBodies)

  const targetRef = useRef(rawBodies)
  const startRef  = useRef(null)
  const rafRef    = useRef(null)

  const animate = useCallback(() => {
    const t    = easeOut((performance.now() - startRef.current) / INTERP_MS)
    const done = t >= 1

    const next = targetRef.current.map(p => {
      const prev = prevXYRef.current[p.name]
      if (!prev) return p
      return {
        ...p,
        x: lerpX(prev.x, p.x, done ? 1 : t, screenWidth),
        y: lerp(prev.y, p.y, done ? 1 : t),
      }
    })

    if (done) {
      const xy = {}
      targetRef.current.forEach(p => { xy[p.name] = { x: p.x, y: p.y } })
      prevXYRef.current = xy
    }

    displayedRef.current = next
    setDisplayed(next)

    if (!done) rafRef.current = requestAnimationFrame(animate)
  }, [screenWidth])

  useEffect(() => {
    if (!rawBodies?.length) return

    targetRef.current = rawBodies

    if (!displayedRef.current?.length) {
      const xy = {}
      rawBodies.forEach(p => { xy[p.name] = { x: p.x, y: p.y } })
      prevXYRef.current    = xy
      displayedRef.current = rawBodies
      setDisplayed(rawBodies)
      return
    }

    const xy = {}
    displayedRef.current.forEach(p => { xy[p.name] = { x: p.x, y: p.y } })
    prevXYRef.current = xy

    cancelAnimationFrame(rafRef.current)
    startRef.current = performance.now()
    rafRef.current   = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(rafRef.current)
  }, [rawBodies, animate])

  return displayed ?? rawBodies
}
