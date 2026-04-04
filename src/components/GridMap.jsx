import { TILE_TYPES } from '../data/scenarios';
import interventionDefs from '../data/interventions';

const OVERLAY_EMOJIS = {
  trees: '🌲',
  pedestrian: '🚶',
  clinic: '🏥',
  greenroof: '🌿',
  elevated: '⬆️',
  mangrove: '🌴',
  shelter: '🏛️',
  bike: '🚲',
  mixeduse: '🏗️',
};

const OVERLAY_COLORS = {
  trees: 'rgba(45, 106, 79, 0.5)',
  pedestrian: 'rgba(232, 212, 77, 0.35)',
  clinic: 'rgba(231, 76, 60, 0.4)',
  greenroof: 'rgba(39, 174, 96, 0.35)',
  elevated: 'rgba(52, 152, 219, 0.35)',
  mangrove: 'rgba(26, 188, 156, 0.4)',
  shelter: 'rgba(155, 89, 182, 0.4)',
  bike: 'rgba(230, 126, 34, 0.35)',
  mixeduse: 'rgba(243, 156, 18, 0.35)',
};

export default function GridMap({ displayGrid }) {
  return (
    <div>
      <div className="card-title">Neighborhood Map</div>
      <div className="grid-map" role="grid" aria-label="Neighborhood grid map">
        {displayGrid.map((row, ri) =>
          row.map((cell, ci) => {
            const tileInfo = TILE_TYPES[cell.type] || TILE_TYPES.empty;
            const overlayEmoji = cell.overlay ? OVERLAY_EMOJIS[cell.overlay] : null;
            const overlayBg = cell.overlay ? OVERLAY_COLORS[cell.overlay] : null;

            return (
              <div
                key={`${ri}-${ci}`}
                className="grid-tile"
                role="gridcell"
                style={{
                  backgroundColor: overlayBg
                    ? overlayBg
                    : tileInfo.color,
                }}
                title={`${tileInfo.label}${cell.overlay ? ' (modified)' : ''}`}
              >
                <span>{tileInfo.emoji}</span>
                {overlayEmoji && (
                  <span className="overlay-emoji">{overlayEmoji}</span>
                )}
                <span className="tile-label">
                  {tileInfo.label}
                  {cell.overlay ? ' ✦' : ''}
                </span>
              </div>
            );
          })
        )}
      </div>
      <GridLegend />
    </div>
  );
}

function GridLegend() {
  const types = ['road', 'housing', 'park', 'empty', 'water', 'commercial'];
  return (
    <div className="grid-legend">
      {types.map((t) => (
        <div key={t} className="legend-item">
          <div
            className="legend-swatch"
            style={{ backgroundColor: TILE_TYPES[t].color }}
          />
          <span>{TILE_TYPES[t].label}</span>
        </div>
      ))}
    </div>
  );
}
