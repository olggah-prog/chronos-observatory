import { useState, useEffect, useRef, useCallback } from 'react'

const DEG = Math.PI / 180
const RAD = 180 / Math.PI

function jdFromDate(d) { return d.getTime() / 86400000.0 + 2440587.5 }

function gmstDeg(jd) {
  const d = jd - 2451545.0, T = d / 36525.0
  let g = 280.46061837 + 360.98564736629*d + 0.000387933*T*T - T*T*T/38710000.0
  return ((g % 360) + 360) % 360
}

function toAltAz(raDeg, decDeg, lstDeg, latDeg) {
  const ha = ((lstDeg - raDeg) % 360 + 360) % 360
  const haR = ha*DEG, dR = decDeg*DEG, lR = latDeg*DEG
  const sinAlt = Math.sin(dR)*Math.sin(lR) + Math.cos(dR)*Math.cos(lR)*Math.cos(haR)
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD
  const cosAz = (Math.sin(dR) - Math.sin(alt*DEG)*Math.sin(lR))
              / (Math.cos(alt*DEG)*Math.cos(lR) + 1e-10)
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz))) * RAD
  if (Math.sin(haR) > 0) az = 360 - az
  return { alt: Math.round(alt*100)/100, az: Math.round(az*100)/100 }
}

export function useStarFieldProjection(catalog, masterTime, lat, lon, maxMag = 5.5) {
  const [stars, setStars] = useState([])
  const rafRef  = useRef(null)
  const lastRef = useRef(0)
  const timeRef = useRef(masterTime)

  useEffect(() => { timeRef.current = masterTime }, [masterTime])

  const project = useCallback(() => {
    const now = performance.now()
    if (now - lastRef.current < 100) {
      rafRef.current = requestAnimationFrame(project)
      return
    }
    lastRef.current = now
    if (!catalog?.length || lat == null || lon == null) {
      rafRef.current = requestAnimationFrame(project)
      return
    }
    const t   = timeRef.current ? new Date(timeRef.current) : new Date()
    const jd  = jdFromDate(t)
    const lst = ((gmstDeg(jd) + lon) % 360 + 360) % 360
    const projected = catalog
      .filter(s => s.mag != null && s.mag <= maxMag && s.name !== 'Sol')
      .map(s => {
        const { alt, az } = toAltAz(s.ra * 15.0, s.dec, lst, lat)
        return { hip: s.hip, name: s.name, ra: s.ra, dec: s.dec,
                 mag: s.mag, con: s.con, alt, az, visible: alt > 0 }
      })
    setStars(projected)
    rafRef.current = requestAnimationFrame(project)
  }, [catalog, lat, lon, maxMag])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(project)
    return () => cancelAnimationFrame(rafRef.current)
  }, [project])

  return stars
}
