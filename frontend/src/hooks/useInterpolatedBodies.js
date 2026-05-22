import { useState, useEffect, useRef, useCallback } from 'react'

const INTERP_MS = 1100

function easeOut(t) {
  return 1 - Math.pow(1 - Math.min(t, 1), 3)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

// Interpolates ONLY screen x/y positions.
// All other fields (visibility, altitude, azimuth, above_horizon)
// come directly from latest API data — never interpolated.
export function useInterpolatedBodies(rawBodies) {
  const displayedRef  = useRef(null)
  const prevXYRef     = useRef({})   // name → {x, y} of last rendered position
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
        ...p,                          // all non-position fields: latest from API
        x: lerp(prev.x, p.x, done ? 1 : t),
        y: lerp(prev.y, p.y, done ? 1 : t),
      }
    })

    if (done) {
      // Store final positions as prev for next animation
      const xy = {}
      targetRef.current.forEach(p => { xy[p.name] = { x: p.x, y: p.y } })
      prevXYRef.current = xy
    }

    displayedRef.current = next
    setDisplayed(next)

    if (!done) rafRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    if (!rawBodies?.length) return

    targetRef.current = rawBodies

    if (!displayedRef.current?.length) {
      // First load — instant, store positions
      const xy = {}
      rawBodies.forEach(p => { xy[p.name] = { x: p.x, y: p.y } })
      prevXYRef.current   = xy
      displayedRef.current = rawBodies
      setDisplayed(rawBodies)
      return
    }

    // Snapshot current interpolated positions as start of next animation
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
