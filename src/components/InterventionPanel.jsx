import interventionDefs from '../data/interventions';

export default function InterventionPanel({
  availableIds,
  activeInterventions,
  onToggle,
}) {
  return (
    <div>
      <div className="card-title">Interventions</div>
      <div className="intervention-list" role="group" aria-label="Intervention toggles">
        {availableIds.map((id) => {
          const def = interventionDefs[id];
          if (!def) return null;
          const isActive = activeInterventions.includes(id);

          return (
            <div
              key={id}
              className={`intervention-toggle ${isActive ? 'active' : ''}`}
              role="switch"
              aria-checked={isActive}
              tabIndex={0}
              onClick={() => onToggle(id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggle(id);
                }
              }}
            >
              <div className="toggle-switch" />
              <div className="toggle-info">
                <div className="toggle-label">
                  <span>{def.icon}</span> {def.label}
                </div>
                <div className="toggle-desc">{def.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
