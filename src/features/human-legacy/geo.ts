import type { HistoricalLocation } from './types'

export type Placed = HistoricalLocation & { latitude: number; longitude: number }

/** True when the location has real coordinates and can be placed on the globe or map. */
export function isPlaced(location: HistoricalLocation): location is Placed {
  return typeof location.latitude === 'number' && typeof location.longitude === 'number'
}

/**
 * Latitude/longitude (degrees) to a point on a sphere. Longitude 0 faces +z and
 * east is +x, so a camera on +z sees the Atlantic with Europe to the right.
 */
export function latLonToXYZ(lat: number, lon: number, radius = 1): [number, number, number] {
  const phi = (lat * Math.PI) / 180
  const lambda = (lon * Math.PI) / 180
  return [
    radius * Math.cos(phi) * Math.sin(lambda),
    radius * Math.sin(phi),
    radius * Math.cos(phi) * Math.cos(lambda),
  ]
}

/** Equirectangular position as percentages, for the 2D map. */
export function latLonToPercent(lat: number, lon: number): { left: number; top: number } {
  return { left: ((lon + 180) / 360) * 100, top: ((90 - lat) / 180) * 100 }
}
