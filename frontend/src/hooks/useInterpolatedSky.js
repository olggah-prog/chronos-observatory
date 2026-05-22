import { useState, useEffect, useRef, useCallback } from 'react'

const INTERP_MS = 1200

function easeOut(t) {
  return 1 - Math.pow(1 - Math.min(t, 1), 3)
}

function lerpAngle(a, b, t) {
  let diff = ((b - a + 540) % 360) - 180
  return (a + diff * t + 360) % 360
}

function lerpPlanets(from, to, t) {
  if (!from || !to) return to
  return to.map(p => {
    const fp = from.find(q => q.name === p.name)
    if (!fp) return p
    return { ...p, longitude: lerpAngle(fp.longitude, p.longitude, t) }
  })
}

function lerpAngles(from, to, t) {
  if (!from || !to) return to
  return {
    asc: lerpAngle(from.asc, to.asc, t),
    dsc: lerpAngle(from.dsc, to.dsc, t),
    mc:  lerpAngle(from.mc,  to.mc,  t),
    ic:  lerpAngle(from.ic,  to.ic,  t),
  }
}

// rawData — latest API response
// seekDt  — live drag target (string ISO or '') for instant visual feedback
export function useInterpolatedSky(rawData, seekDt) {
  const displayedRef = useRef(null)
  const [displayed, setDisplayed] = useState(null)

  const targetRef  = useRef(null)
  const startRef   = useRef(null)
  const fromRef    = useRef(null)
  const rafRef     = useRef(null)

  const animate = useCallback(() => {
    const now = performance.now()
    const t   = easeOut((now - startRef.current) / INTERP_MS)
    const done = t >= 1

    const next = {
      ...targetRef.current,
      planets: lerpPlanets(fromRef.current?.planets, targetRef.current.planets, done ? 1 : t),
      angles:  lerpAngles(fromRef.current?.angles,  targetRef.current.angles,  done ? 1 : t),
    }

    displayedRef.current = next
    setDisplayed(next)

    if (!done) {
      rafRef.current = requestAnimationFrame(animate)
    }
  }, [])

  // When new API data arrives — animate from current visual position
  useEffect(() => {
    if (!rawData) return
    if (!displayedRef.current) {
      displayedRef.current = rawData
      targetRef.current    = rawData
      setDisplayed(rawData)
      return
    }
    cancelAnimationFrame(rafRef.current)
    fromRef.current   = displayedRef.current
    targetRef.current = rawData
    startRef.current  = performance.now()
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [rawData, animate])

  return displayed
}
