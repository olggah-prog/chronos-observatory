import { useState, useEffect, useRef, useCallback } from 'react'

const INTERP_MS = 1100

function easeOut(t) {
  return 1 - Math.pow(1 - Math.min(t, 1), 3)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

export function useInterpolatedBodies(rawBodies) {
  const displayedRef = useRef(null)
  const [displayed, setDisplayed] = useState(rawBodies)

  const fromRef   = useRef(null)
  const targetRef = useRef(null)
  const startRef  = useRef(null)
  const rafRef    = useRef(null)

  const animate = useCallback(() => {
    const t    = easeOut((performance.now() - startRef.current) / INTERP_MS)
    const done = t >= 1

    const next = targetRef.current.map(p => {
      const fp = fromRef.current?.find(q => q.name === p.name)
      if (!fp) return p
      return { ...p, x: lerp(fp.x, p.x, done ? 1 : t), y: lerp(fp.y, p.y, done ? 1 : t) }
    })

    displayedRef.current = next
    setDisplayed(next)

    if (!done) rafRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    if (!rawBodies?.length) return
    if (!displayedRef.current?.length) {
      displayedRef.current = rawBodies
      setDisplayed(rawBodies)
      return
    }
    cancelAnimationFrame(rafRef.current)
    fromRef.current   = displayedRef.current
    targetRef.current = rawBodies
    startRef.current  = performance.now()
    rafRef.current    = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [rawBodies, animate])

  return displayed
}
