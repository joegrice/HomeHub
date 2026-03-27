"use client"

import { useState, useEffect, useCallback, useRef } from "react"

/**
 * Return value from `usePlugin`. All widgets destructure this shape.
 * @template T The normalised data type returned by the plugin's API route.
 */
export interface UsePluginResult<T> {
  /** Parsed API response, or `null` before the first successful fetch. */
  data: T | null
  /** True while a fetch is in flight. */
  loading: boolean
  /** Error message from the most recent failed fetch, or `null` on success. */
  error: string | null
  /** Timestamp of the last successful fetch, used to render "Updated X ago". */
  lastUpdated: Date | null
  /** Manually trigger an immediate refresh, cancelling any in-flight request first. */
  refresh: () => void
}

/**
 * Generic polling hook used by every dashboard widget.
 *
 * Fetches `apiPath` immediately on mount, then on a `refreshMs` interval.
 * Any in-flight request is aborted before a new one starts (manual refresh or
 * interval tick), preventing stale responses from overwriting newer data.
 *
 * @template T The normalised data type expected from the API route.
 * @param apiPath Absolute path to the Next.js Route Handler, e.g. `"/api/trains"`.
 * @param refreshMs Client-side polling interval in milliseconds.
 * @returns `{ data, loading, error, lastUpdated, refresh }`
 */
export function usePlugin<T>(
  apiPath: string,
  refreshMs: number
): UsePluginResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    try {
      const res = await fetch(apiPath, { signal: abortRef.current.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [apiPath])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, refreshMs)
    return () => {
      clearInterval(id)
      abortRef.current?.abort()
    }
  }, [fetchData, refreshMs])

  return { data, loading, error, lastUpdated, refresh: fetchData }
}
