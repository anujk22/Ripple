import type { DisplayCell } from '../data/engine'
import { TILE_TYPES } from '../data/scenarios'
import type { TileType } from '../data/scenarios'

const OVERLAY_EMOJIS: Record<string, string> = {
  trees: '🌲', pedestrian: '🚶', clinic: '🏥', greenroof: '🌿',
  elevated: '⬆️', mangrove: '🌴', shelter: '🏛️', bike: '🚲', mixeduse: '🏗️',
}

interface GridMapProps {
  displayGrid: DisplayCell[][]
}

export default function GridMap({ displayGrid }: GridMapProps) {
  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.15em] uppercase text-slate-400 mb-3">
        Neighborhood Map
      </div>
      <div
        className="grid gap-0.5 p-1.5 bg-black/[0.04] rounded-lg"
        style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}
      >
        {displayGrid.map((row, ri) =>
          row.map((cell, ci) => {
            const tileInfo = TILE_TYPES[cell.type as TileType] || TILE_TYPES.empty
            const overlayEmoji = cell.overlay ? OVERLAY_EMOJIS[cell.overlay] : null

            return (
              <div
                key={`${ri}-${ci}`}
                className="aspect-square flex items-center justify-center rounded relative text-base sm:text-lg
                           border border-transparent hover:border-black/10 hover:scale-105
                           transition-all duration-200 cursor-default group"
                style={{ backgroundColor: tileInfo.color }}
              >
                <span>{tileInfo.emoji}</span>
                {overlayEmoji && (
                  <span className="absolute bottom-0.5 right-0.5 text-sm animate-in fade-in zoom-in duration-300">
                    {overlayEmoji}
                  </span>
                )}
                {/* Tooltip */}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
                                 bg-white text-slate-800 text-[10px] px-2 py-0.5 rounded
                                 whitespace-nowrap opacity-0 group-hover:opacity-100
                                 transition-opacity pointer-events-none border border-black/10 z-10
                                 shadow-sm">
                  {tileInfo.label}{cell.overlay ? ' ✦' : ''}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {(['road', 'housing', 'park', 'empty', 'water', 'commercial'] as TileType[]).map((t) => (
          <div key={t} className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <div
              className="w-3 h-3 rounded-sm border border-black/10"
              style={{ backgroundColor: TILE_TYPES[t].color }}
            />
            <span>{TILE_TYPES[t].label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
