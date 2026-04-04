import { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import ScenarioSelector from './components/ScenarioSelector';
import GridMap from './components/GridMap';
import InterventionPanel from './components/InterventionPanel';
import IndexGauges from './components/IndexGauges';
import PrioritySlider from './components/PrioritySlider';
import NarrativeCard from './components/NarrativeCard';
import scenarios from './data/scenarios';
import { computeIndices, generateNarrative, getDisplayGrid } from './data/engine';

const STORAGE_KEY = 'sts-state';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export default function App() {
  const saved = useMemo(() => loadState(), []);

  const [scenarioId, setScenarioId] = useState(
    saved?.scenarioId || scenarios[0].id
  );
  const [activeInterventions, setActiveInterventions] = useState(
    saved?.activeInterventions || []
  );
  const [priority, setPriority] = useState(saved?.priority ?? 50);

  const scenario = scenarios.find((s) => s.id === scenarioId) || scenarios[0];

  // Filter active interventions to only those available in current scenario
  const validInterventions = activeInterventions.filter((id) =>
    scenario.availableInterventions.includes(id)
  );

  const indices = useMemo(
    () => computeIndices(scenario, validInterventions),
    [scenario, validInterventions]
  );

  const displayGrid = useMemo(
    () => getDisplayGrid(scenario, validInterventions),
    [scenario, validInterventions]
  );

  const narrative = useMemo(
    () =>
      generateNarrative(
        scenario,
        validInterventions,
        indices,
        scenario.baseIndices,
        priority
      ),
    [scenario, validInterventions, indices, priority]
  );

  // Persist state
  useEffect(() => {
    saveState({ scenarioId, activeInterventions: validInterventions, priority });
  }, [scenarioId, validInterventions, priority]);

  function handleScenarioChange(id) {
    setScenarioId(id);
    setActiveInterventions([]); // reset interventions on scenario change
  }

  function handleToggleIntervention(id) {
    setActiveInterventions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <>
      <Header />

      <div className="scenario-selector glass-card">
        <ScenarioSelector
          selectedId={scenarioId}
          onChange={handleScenarioChange}
        />
      </div>

      <div className="main-layout" style={{ marginTop: '16px' }}>
        <div className="left-panel">
          <div className="glass-card">
            <GridMap displayGrid={displayGrid} />
          </div>
          <div className="glass-card">
            <InterventionPanel
              availableIds={scenario.availableInterventions}
              activeInterventions={validInterventions}
              onToggle={handleToggleIntervention}
            />
          </div>
        </div>

        <div className="right-panel">
          <div className="glass-card">
            <IndexGauges
              indices={indices}
              baseIndices={scenario.baseIndices}
              priority={priority}
            />
          </div>
          <div className="glass-card">
            <PrioritySlider priority={priority} onChange={setPriority} />
          </div>
          <div className="glass-card">
            <NarrativeCard narrative={narrative} />
          </div>
        </div>
      </div>
    </>
  );
}
