import { useCallback, useEffect, useRef, useState } from 'react'
import { Geolocation, type CallbackID } from '@capacitor/geolocation'
import type { RoutePoint } from '../../db/types'
import { haversineMeters } from '../../lib/geo'

export type RunState = 'idle' | 'running' | 'paused' | 'stopped'

const MIN_ACCURACY_M = 30 // ignore wildly inaccurate fixes
const MIN_MOVE_M = 2 // ignore GPS jitter below this

export function useRunTracker() {
  const [state, setState] = useState<RunState>('idle')
  const [route, setRoute] = useState<RoutePoint[]>([])
  const [distanceM, setDistanceM] = useState(0)
  const [elapsedS, setElapsedS] = useState(0)
  const [elevationGainM, setElevationGainM] = useState(0)

  const watchId = useRef<CallbackID | null>(null)
  const tickInterval = useRef<number | null>(null)
  const startedAt = useRef<number | null>(null)
  const pausedAccumS = useRef(0)
  const pauseStartedAt = useRef<number | null>(null)
  const lastAlt = useRef<number | null>(null)

  const addPoint = useCallback((p: RoutePoint) => {
    setRoute((prev) => {
      const last = prev[prev.length - 1]
      if (!last) return [...prev, p]
      const d = haversineMeters(last, p)
      if (d < MIN_MOVE_M) return prev
      setDistanceM((dist) => dist + d)
      return [...prev, p]
    })
    if (p.alt != null) {
      if (lastAlt.current != null && p.alt > lastAlt.current) {
        setElevationGainM((g) => g + (p.alt! - lastAlt.current!))
      }
      lastAlt.current = p.alt
    }
  }, [])

  const startWatch = useCallback(async () => {
    const id = await Geolocation.watchPosition({ enableHighAccuracy: true, timeout: 10000, minimumUpdateInterval: 2000 }, (pos) => {
      if (!pos) return
      if (pos.coords.accuracy != null && pos.coords.accuracy > MIN_ACCURACY_M) return
      addPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude, ts: pos.timestamp, alt: pos.coords.altitude ?? undefined })
    })
    watchId.current = id
  }, [addPoint])

  const stopWatch = useCallback(async () => {
    if (watchId.current) {
      await Geolocation.clearWatch({ id: watchId.current })
      watchId.current = null
    }
  }, [])

  const start = useCallback(async () => {
    startedAt.current = Date.now()
    pausedAccumS.current = 0
    setRoute([])
    setDistanceM(0)
    setElapsedS(0)
    setElevationGainM(0)
    lastAlt.current = null
    setState('running')
    await startWatch()
    tickInterval.current = window.setInterval(() => {
      if (startedAt.current) {
        setElapsedS(Math.floor((Date.now() - startedAt.current) / 1000) - pausedAccumS.current)
      }
    }, 1000)
  }, [startWatch])

  const pause = useCallback(async () => {
    pauseStartedAt.current = Date.now()
    setState('paused')
    await stopWatch()
  }, [stopWatch])

  const resume = useCallback(async () => {
    if (pauseStartedAt.current) {
      pausedAccumS.current += Math.floor((Date.now() - pauseStartedAt.current) / 1000)
      pauseStartedAt.current = null
    }
    setState('running')
    await startWatch()
  }, [startWatch])

  const stop = useCallback(async () => {
    await stopWatch()
    if (tickInterval.current) window.clearInterval(tickInterval.current)
    setState('stopped')
  }, [stopWatch])

  useEffect(
    () => () => {
      stopWatch()
      if (tickInterval.current) window.clearInterval(tickInterval.current)
    },
    [stopWatch],
  )

  const avgPaceSecPerKm = distanceM > 0 ? elapsedS / (distanceM / 1000) : 0
  const getStartedAt = useCallback(() => startedAt.current, [])

  return {
    state,
    route,
    distanceM,
    elapsedS,
    elevationGainM,
    avgPaceSecPerKm,
    getStartedAt,
    start,
    pause,
    resume,
    stop,
  }
}
