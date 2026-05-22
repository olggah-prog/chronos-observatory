import { useState, useEffect, useRef } from 'react'

const INTERP_MS = 900  // duration of sky drift animation
const EASE_EXP  = 2.5  // easing exponent — higher = slower start, faster end

function easeInOut(t) {
  // Smooth cubic easing: slow start, slow end
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function lerpAngle(a, b, t) {
  // Shortest arc interpolation for ecliptic longitude (0–360)
  let diff = ((b - a + 540) % 360) - 180
  return (a + diff * t + 360) % 360
}

function interpolatePlanets(prev, next, t) {
  if (!prev || !next) return next
  const et = easeInOut(Math.min(t, 1))
  return next.map(p => {
    const prevP = prev.find(pp => pp.name === p.name)
    if (!prevP) return p
    return { ...p, longitude: lerpAngle(prevP.longitude, p.longitude, et) }
  })
}

function interpolateAngles(prev, next, t) {
  if (!prev || !next) return next
  const et = easeInOut(Math.min(t, 1))
  return {
    asc: lerpAngle(prev.asc, next.asc, et),
    dsc: lerpAngle(prev.dsc, next.dsc, et),
    mc:  lerpAngle(prev.mc,  next.mc,  et),
    ic:  lerpAngle(prev.ic,  next.ic,  et),
  }
}

// Takes raw data from useSkyData and returns smoothly interpolated version
export function useInterpolatedSky(rawData) {
  const [displayed, setDisplayed] = useState(rawData)
  const prevRef    = useRef(null)
  const targetRef  = useRef(null)
  const startRef   = useRef(null)
  const rafRef     = useRef(null)

  useEffect(() => {
    if (!rawData) return

    // First load — no animation
    if (!prevRef.current) {
      prevRef.current = rawData
      setDisplayed(rawData)
      return
    }

    // New data arrived — start interpolation
    targetRef.current = rawData
    startRef.current  = performance.now()
    const from = prevRef.current

    cancelAnimationFrame(rafRef.current)

    function tick(now) {
      const t = (now - startRef.current) / INTERP_MS
      if (t >= 1) {
        prevRef.current = rawData
        setDisplayed(rawData)
        return
      }
      setDisplayed({
        ...rawData,
        planets: interpolatePlanets(from.planets, rawData.planets, t),
        angles:  interpolateAngles(from.angles, rawData.angles, t),
      })
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [rawData])

  return displayed
}
