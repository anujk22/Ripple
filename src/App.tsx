import { useState, useMemo, useEffect } from 'react'
import CobeGlobe from './components/ui/CobeGlobe'
import MeshGradientBg from './components/ui/MeshGradientBg'
import GridMap from './components/GridMap'
import InterventionPanel from './components/InterventionPanel'
import IndexGauges from './components/IndexGauges'
import PrioritySlider from './components/PrioritySlider'
import NarrativeCard from './components/NarrativeCard'
import scenarios from './data/scenarios'
import { computeIndices, generateNarrative, getDisplayGrid } from './data/engine'

const STORAGE_KEY = 'sts-state-v3'

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
      <>
        <MeshGradientBg />
        <div className={`relative z-10 min-h-screen flex flex-col items-center justify-center px-6 transition-opacity duration-500 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
          {/* Title */}
          <div className="text-center mb-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl md:text-5xl font-extralight tracking-tight text-slate-800">
              Systemic Trade-Off
              <span className="block font-semibold text-slate-900">Simulator</span>
            </h1>
            <p className="text-slate-600/80 text-sm mt-3 max-w-md mx-auto leading-relaxed">
              Click a city to explore how urban interventions shift heat,
              emissions, evacuation, and health access.
            </p>
          </div>

          {/* Globe */}
          <div className="animate-in fade-in zoom-in-95 duration-1000 delay-300 w-full max-w-lg -mt-4">
            <CobeGlobe
              onRegionClick={handleGlobeClick}
              className="mx-auto"
            />
          </div>

          {/* City hint buttons */}
          <div className="flex gap-4 -mt-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => handleGlobeClick(s.id)}
                className="text-[11px] text-slate-600 hover:text-slate-900 transition-colors cursor-pointer
                           border border-slate-900/10 hover:border-slate-900/25 px-4 py-1.5 rounded-full
                           bg-white/40 backdrop-blur-sm hover:bg-white/60"
              >
                {s.region}
              </button>
            ))}
          </div>

          <div className="mt-6 text-[10px] text-slate-500/60 tracking-widest uppercase animate-in fade-in duration-1000 delay-700">
            Toy model for exploring trade-offs — not a planning tool
          </div>
        </div>
      </>
    )
  }

  // ─── Simulator View ───
  return (
    <>
      <MeshGradientBg />
      <div className={`relative z-10 min-h-screen p-4 md:p-8 flex items-center justify-center transition-opacity duration-500 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
        {/* Main centered glass container */}
        <div className="w-full max-w-7xl max-h-[92vh] overflow-y-auto bg-white/40 backdrop-blur-3xl border border-white/40 shadow-2xl rounded-3xl flex flex-col">
          
          {/* Header embedded in modal */}
          <div className="px-6 py-4 border-b border-black/5 flex flex-wrap items-center justify-between gap-4 sticky top-0 bg-white/30 backdrop-blur-md z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToGlobe}
                className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors cursor-pointer
                           flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Globe
              </button>
              <div className="w-px h-4 bg-black/10" />
              <div>
                <h1 className="text-sm font-semibold text-slate-800">{scenario.name}</h1>
                <p className="text-[11px] text-slate-500 line-clamp-1">{scenario.description}</p>
              </div>
            </div>

            {/* Scenario switcher */}
            <select
              value={scenarioId}
              onChange={(e) => {
                setScenarioId(e.target.value)
                setActiveInterventions([])
              }}
              className="bg-white/50 text-[11px] text-slate-700 border border-black/[0.08] shadow-sm
                         rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:border-black/20 hover:bg-white/70 transition-all font-medium"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Core content grid */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Map */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <Card>
                <GridMap displayGrid={displayGrid} />
              </Card>
            </div>

            {/* Middle Column: Controls */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <Card>
                <InterventionPanel
                  availableIds={scenario.availableInterventions}
                  activeInterventions={validInterventions}
                  onToggle={handleToggleIntervention}
                />
              </Card>
              <Card>
                <PrioritySlider priority={priority} onChange={setPriority} />
              </Card>
            </div>

            {/* Right Column: Output / Indices */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <Card>
                <IndexGauges indices={indices} baseIndices={scenario.baseIndices} priority={priority} />
              </Card>
              <Card>
                <NarrativeCard narrative={narrative} />
              </Card>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/50 backdrop-blur-md border border-black/[0.06] rounded-xl p-5
                    shadow-sm transition-colors duration-200 hover:bg-white/60
                    animate-in fade-in slide-in-from-bottom-2 duration-500">
      {children}
    </div>
  )
}
