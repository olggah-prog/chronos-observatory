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

export function useInterpolatedSky(rawData) {
  // displayedRef holds the CURRENT visually rendered snapshot (mutable, no re-render)
  const displayedRef = useRef(null)
  const [displayed, setDisplayed] = useState(null)

  const targetRef   = useRef(null)  // latest rawData we're animating toward
  const startRef    = useRef(null)  // when current animation started
  const fromRef     = useRef(null)  // snapshot of displayed at animation start
  const rafRef      = useRef(null)

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

  useEffect(() => {
    if (!rawData) return

    // First load — instant, no animation
    if (!displayedRef.current) {
      displayedRef.current = rawData
      targetRef.current    = rawData
      setDisplayed(rawData)
      return
    }

    // New target arrived — animate FROM current displayed position
    // This prevents backward jumps: we always start from where we ARE visually
    cancelAnimationFrame(rafRef.current)
    fromRef.current   = displayedRef.current  // snapshot current visual state
    targetRef.current = rawData
    startRef.current  = performance.now()

    rafRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(rafRef.current)
  }, [rawData, animate])

  return displayed
}
