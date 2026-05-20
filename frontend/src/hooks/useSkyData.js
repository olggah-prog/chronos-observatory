import { useState, useEffect, useRef, useCallback } from 'react'

export function useSkyData(datetime) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const abortRef = useRef(null)

  const run = useCallback(async (dt) => {
    // Cancel any in-flight request before starting a new one
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setError(null)
    // Intentionally NOT clearing `data` — stale sky stays visible while we load

    try {
      const url = dt ? `/api/sky?dt=${encodeURIComponent(dt)}` : '/api/sky'
      const res = await fetch(url, { signal: ctrl.signal })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || `HTTP ${res.status}`)
      }
      // Only commit if this controller is still current (not superseded)
      if (abortRef.current === ctrl) {
        setData(await res.json())
      }
    } catch (e) {
      if (e.name !== 'AbortError' && abortRef.current === ctrl) {
        setError(e.message)
      }
    } finally {
      if (abortRef.current === ctrl) setLoading(false)
    }
  }, [])

  useEffect(() => {
    run(datetime)
    return () => abortRef.current?.abort()
  }, [datetime, run])

  // Exposed for the 60-s live auto-refresh in App
  const refetch = useCallback(() => run(datetime), [datetime, run])

  return { data, loading, error, refetch }
}
