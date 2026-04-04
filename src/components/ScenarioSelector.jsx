import scenarios from '../data/scenarios';

export default function ScenarioSelector({ selectedId, onChange }) {
  const selected = scenarios.find((s) => s.id === selectedId);

  return (
    <div className="scenario-selector">
      <label className="card-title" htmlFor="scenario-select">
        Scenario
      </label>
      <select
        id="scenario-select"
        className="scenario-select"
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
      >
        {scenarios.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      {selected && (
        <p className="scenario-description">{selected.description}</p>
      )}
    </div>
  );
}
