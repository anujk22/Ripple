import { computeAlignmentScore } from '../data/engine';

const INDEX_CONFIG = {
  heat: {
    label: 'Heat Exposure',
    icon: '🌡️',
    color: 'var(--heat-color)',
    inverted: true, // lower is better
    description: 'Surface temperature and urban heat island intensity. Lower is better.',
  },
  emissions: {
    label: 'Car Emissions',
    icon: '💨',
    color: 'var(--emissions-color)',
    inverted: true,
    description: 'Traffic-related air pollution from everyday vehicle use. Lower is better.',
  },
  evacuation: {
    label: 'Evacuation Difficulty',
    icon: '🚨',
    color: 'var(--evacuation-color)',
    inverted: true,
    description: 'How hard it is to evacuate by vehicle during emergencies. Lower is better.',
  },
  healthAccess: {
    label: 'Health Access',
    icon: '❤️',
    color: 'var(--health-color)',
    inverted: false, // higher is better
    description: 'Ease of reaching healthcare on foot or nearby. Higher is better.',
  },
};

export default function IndexGauges({ indices, baseIndices, priority }) {
  const alignment = computeAlignmentScore(indices, priority);

  return (
    <div>
      <div className="card-title">Trade-Off Indices</div>
      <div className="index-gauges">
        {Object.entries(INDEX_CONFIG).map(([key, config]) => {
          const value = indices[key];
          const base = baseIndices[key];
          const delta = value - base;

          // Determine delta color class
          let deltaClass = 'neutral';
          if (key === 'healthAccess') {
            deltaClass = delta > 0 ? 'health-positive' : delta < 0 ? 'health-negative' : 'neutral';
          } else {
            deltaClass = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
          }

          const deltaText =
            delta === 0
              ? '—'
              : `${delta > 0 ? '+' : ''}${delta}`;

          return (
            <div key={key} className="index-item">
              <div className="index-header">
                <span className="index-label">
                  {config.icon} {config.label}
                </span>
                <span>
                  <span className="index-value" style={{ color: config.color }}>
                    {value}
                  </span>
                  {delta !== 0 && (
                    <span className={`index-delta ${deltaClass}`}>
                      {deltaText}
                    </span>
                  )}
                </span>
              </div>
              <div className="index-bar-track">
                <div
                  className="index-bar-fill"
                  style={{
                    width: `${value}%`,
                    background: `linear-gradient(90deg, ${config.color}88, ${config.color})`,
                  }}
                />
                <div
                  className="index-bar-baseline"
                  style={{ left: `${base}%` }}
                  title={`Baseline: ${base}`}
                />
              </div>
              <div className="index-description">{config.description}</div>
            </div>
          );
        })}
      </div>

      <div className="alignment-section">
        <div className="alignment-score">
          <div>
            <div className="alignment-value">{alignment}</div>
            <div className="alignment-label">Alignment Score</div>
          </div>
        </div>
      </div>
    </div>
  );
}
