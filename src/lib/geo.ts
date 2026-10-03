import { Geolocation } from '@capacitor/geolocation'

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const status = await Geolocation.requestPermissions()
    return status.location === 'granted' || status.coarseLocation === 'granted'
  } catch {
    return false
  }
}

/** Haversine distance between two lat/lng points, in meters. */
export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}
