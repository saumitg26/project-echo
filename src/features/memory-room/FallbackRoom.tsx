import type { ArtifactKey } from './types'
import { artifactData, roomImage, scrapbookImage } from './data'

interface FallbackRoomProps {
  explored: ArtifactKey[]
  lastExplored: ArtifactKey | null
  open: ArtifactKey | null
  onSelect: (key: ArtifactKey) => void
}

export function FallbackRoom({
  explored,
  lastExplored,
  open,
  onSelect,
}: FallbackRoomProps) {
  const keys: ArtifactKey[] = ['photo', 'letter', 'audio', 'keepsake', 'window']

  return (
    <div
      className={`room-screen memory-world fallback-2d ${open ? 'memory-is-open' : ''} ${lastExplored ? `last-${lastExplored}` : ''}`}
      style={{ backgroundImage: `url(${roomImage})` }}
    >
      <div className="room-depth" aria-hidden="true">
        <div className="sunbeam" />
        <div className="floating-dust">
          {Array.from({ length: 16 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
        <div
          className="foreground-table"
          style={{ backgroundImage: `url(${scrapbookImage})` }}
        />
      </div>

      {keys.map((key, i) => {
        const item = artifactData[key]
        return (
          <button
            key={key}
            className={`hotspot hotspot-${i + 1} ${explored.includes(key) ? 'explored' : ''} ${lastExplored === key ? 'last-explored' : ''}`}
            onClick={() => onSelect(key)}
            aria-label={`Open ${item.label}: ${item.hint}`}
          >
            <span className="hotspot-pulse" />
            <span className="hotspot-icon">
              {key === 'photo' && '📷'}
              {key === 'letter' && '✉️'}
              {key === 'audio' && '🎙️'}
              {key === 'keepsake' && '✨'}
              {key === 'window' && '🌐'}
            </span>
            <span className="hotspot-label">
              <b>{item.label}</b>
              <small>{item.hint}</small>
            </span>
            {explored.includes(key) && <i className="explored-mark">VIEWED</i>}
          </button>
        )
      })}
    </div>
  )
}
