import { useState, useMemo, useEffect } from 'react'
import Globe from './components/ui/Globe'
import GridMap from './components/GridMap'
import InterventionPanel from './components/InterventionPanel'
import IndexGauges from './components/IndexGauges'
import PrioritySlider from './components/PrioritySlider'
import NarrativeCard from './components/NarrativeCard'
import scenarios from './data/scenarios'
import { computeIndices, generateNarrative, getDisplayGrid } from './data/engine'

const STORAGE_KEY = 'sts-state-v2'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function saveState(state: any) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

type View = 'globe' | 'simulator'

export default function App() {
  const saved = useMemo(() => loadState(), [])

  const [view, setView] = useState<View>(saved?.view || 'globe')
  const [scenarioId, setScenarioId] = useState(saved?.scenarioId || scenarios[0].id)
  const [activeInterventions, setActiveInterventions] = useState<string[]>(saved?.activeInterventions || [])
  const [priority, setPriority] = useState(saved?.priority ?? 50)
  const [transitioning, setTransitioning] = useState(false)

  const scenario = scenarios.find((s) => s.id === scenarioId) || scenarios[0]
  const validInterventions = activeInterventions.filter((id) => scenario.availableInterventions.includes(id))

  const indices = useMemo(() => computeIndices(scenario, validInterventions), [scenario, validInterventions])
  const displayGrid = useMemo(() => getDisplayGrid(scenario, validInterventions), [scenario, validInterventions])
  const narrative = useMemo(
    () => generateNarrative(scenario, validInterventions, indices, scenario.baseIndices, priority),
    [scenario, validInterventions, indices, priority],
  )

  useEffect(() => {
    saveState({ view, scenarioId, activeInterventions: validInterventions, priority })
  }, [view, scenarioId, validInterventions, priority])

  function handleGlobeClick(id: string) {
    setTransitioning(true)
    setScenarioId(id)
    setActiveInterventions([])
    setTimeout(() => {
      setView('simulator')
      setTransitioning(false)
    }, 600)
  }

  function handleBackToGlobe() {
    setTransitioning(true)
    setTimeout(() => {
      setView('globe')
      setTransitioning(false)
    }, 400)
  }

  function handleToggleIntervention(id: string) {
    setActiveInterventions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // ─── Globe Landing ───
  if (view === 'globe') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center px-6 transition-opacity duration-500 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
        {/* Title */}
        <div className="text-center mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl md:text-5xl font-extralight tracking-tight text-white">
            Systemic Trade-Off
            <span className="block font-medium">Simulator</span>
          </h1>
          <p className="text-neutral-500 text-sm mt-3 max-w-md mx-auto leading-relaxed">
            Click a city to explore how urban interventions shift heat,
            emissions, evacuation, and health access.
          </p>
        </div>

        {/* Globe */}
        <div className="animate-in fade-in zoom-in-95 duration-1000 delay-300 w-full max-w-3xl">
          <Globe
            width={800}
            height={550}
            onRegionClick={handleGlobeClick}
            className="mx-auto"
          />
        </div>

        {/* City hints */}
        <div className="flex gap-6 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => handleGlobeClick(s.id)}
              className="text-[11px] text-neutral-500 hover:text-white transition-colors cursor-pointer
                         border border-white/[0.06] hover:border-white/20 px-3 py-1.5 rounded-full"
            >
              {s.region}
            </button>
          ))}
        </div>

        <div className="mt-6 text-[10px] text-neutral-600 tracking-widest uppercase animate-in fade-in duration-1000 delay-700">
          Toy model for exploring trade-offs — not a planning tool
        </div>
      </div>
    )
  }

  // ─── Simulator View ───
  return (
    <div className={`min-h-screen transition-opacity duration-500 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToGlobe}
              className="text-[11px] text-neutral-500 hover:text-white transition-colors cursor-pointer
                         flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Globe
            </button>
            <div className="w-px h-4 bg-white/10" />
            <h1 className="text-sm font-medium text-white">{scenario.name}</h1>
          </div>

          {/* Scenario switcher */}
          <select
            value={scenarioId}
            onChange={(e) => {
              setScenarioId(e.target.value)
              setActiveInterventions([])
            }}
            className="bg-transparent text-[11px] text-neutral-400 border border-white/[0.06]
                       rounded px-2 py-1 outline-none cursor-pointer hover:border-white/15 transition-colors"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id} className="bg-black">{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scenario description */}
      <div className="max-w-6xl mx-auto px-6 pt-5 pb-2">
        <p className="text-[12px] text-neutral-500 max-w-2xl">{scenario.description}</p>
      </div>

      {/* Main two-column layout */}
      <div className="max-w-6xl mx-auto px-6 py-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          <Card>
            <GridMap displayGrid={displayGrid} />
          </Card>
          <Card>
            <InterventionPanel
              availableIds={scenario.availableInterventions}
              activeInterventions={validInterventions}
              onToggle={handleToggleIntervention}
            />
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <Card>
            <IndexGauges indices={indices} baseIndices={scenario.baseIndices} priority={priority} />
          </Card>
          <Card>
            <PrioritySlider priority={priority} onChange={setPriority} />
          </Card>
          <Card>
            <NarrativeCard narrative={narrative} />
          </Card>
        </div>
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5
                    transition-colors duration-200 hover:border-white/10
                    animate-in fade-in slide-in-from-bottom-2 duration-500">
      {children}
    </div>
  )
}
