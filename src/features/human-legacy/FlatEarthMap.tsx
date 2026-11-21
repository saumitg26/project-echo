import { useMemo } from 'react'
import { landCells } from './landMask'
import { isPlaced, latLonToPercent } from './geo'
import type { HistoricalLocation } from './types'

type Props = {
  locations: HistoricalLocation[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
}

/**
 * 2D projection of the same land data as the globe, with markers at their real
 * latitude and longitude. Used when WebGL is unavailable or the visitor prefers it.
 */
export default function FlatEarthMap({ locations, selectedSlug, onSelect }: Props) {
  const land = useMemo(() => landCells().map(([lat, lon]) => `M${(lon + 180 - 0.62).toFixed(2)} ${(90 - lat - 0.62).toFixed(2)}h1.24v1.24h-1.24z`).join(''), [])
  const grid = useMemo(() => {
    const parts: string[] = []
    for (let lon = -150; lon <= 150; lon += 30) parts.push(`M${lon + 180} 0V180`)
    for (let lat = -60; lat <= 60; lat += 30) parts.push(`M0 ${90 - lat}H360`)
    return parts.join('')
  }, [])
  const placed = locations.filter(isPlaced)
  const selected = placed.find((location) => location.slug === selectedSlug)

  return <div className="hl-flat-wrap">
    <div className="hl-flat" role="group" aria-label="Flat map of the four historical locations">
      <svg viewBox="0 0 360 180" aria-hidden="true" focusable="false">
        <path d={grid} className="hl-flat-grid" />
        <path d={land} className="hl-flat-land" />
      </svg>
      <div className="hl-flat-scan" aria-hidden="true" />
      {selected && (() => {
        const { left, top } = latLonToPercent(selected.latitude, selected.longitude)
        return <>
          <i className="hl-cross hl-cross-x" style={{ top: `${top}%` }} aria-hidden="true" />
          <i className="hl-cross hl-cross-y" style={{ left: `${left}%` }} aria-hidden="true" />
        </>
      })()}
      {placed.map((location) => {
        const { left, top } = latLonToPercent(location.latitude, location.longitude)
        const active = location.slug === selectedSlug
        return <button key={location.id} type="button" className={`hl-flat-pin ${active ? 'is-selected' : ''} ${left > 70 ? 'flip' : ''}`}
          style={{ left: `${left}%`, top: `${top}%` }} onClick={() => onSelect(location.slug)} aria-pressed={active}
          aria-label={`Focus historical archive for ${location.name}, ${location.records.length} records`}>
          <i /><span><b>{location.name}</b><small>{location.records.length} RECORDS</small></span>
        </button>
      })}
    </div>
  </div>
}
