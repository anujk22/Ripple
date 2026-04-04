export default function PrioritySlider({ priority, onChange }) {
  const label =
    priority < 35
      ? 'Safety-focused'
      : priority > 65
        ? 'Quality-of-life focused'
        : 'Balanced';

  return (
    <div>
      <div className="card-title">Stakeholder Priority</div>
      <div className="priority-slider-container">
        <div className="priority-labels">
          <span className="priority-label">🛡️ Safety &amp; Evacuation</span>
          <span className="priority-label">🌿 Quality of Life</span>
        </div>
        <input
          type="range"
          className="priority-slider"
          min={0}
          max={100}
          value={priority}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Stakeholder priority slider"
        />
        <div className="priority-value-text">{label}</div>
      </div>
    </div>
  );
}
