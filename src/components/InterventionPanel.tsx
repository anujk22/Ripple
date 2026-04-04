import interventionDefs from '../data/interventions'

interface InterventionPanelProps {
  availableIds: string[]
  activeInterventions: string[]
  onToggle: (id: string) => void
}

export default function InterventionPanel({ availableIds, activeInterventions, onToggle }: InterventionPanelProps) {
  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.15em] uppercase text-slate-400 mb-3">
        Interventions
      </div>
      <div className="flex flex-col gap-1.5">
        {availableIds.map((id) => {
          const def = interventionDefs[id]
          if (!def) return null
          const isActive = activeInterventions.includes(id)

          return (
            <button
              key={id}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg border text-left
                          transition-all duration-200 cursor-pointer group
                          ${isActive
                            ? 'bg-emerald-50/60 border-emerald-200/80'
                            : 'bg-white/20 border-black/[0.06] hover:bg-white/40 hover:border-black/10'
                          }`}
              onClick={() => onToggle(id)}
              role="switch"
              aria-checked={isActive}
            >
              {/* Toggle switch */}
              <div className={`w-9 h-5 rounded-full relative flex-shrink-0 transition-colors duration-200
                              ${isActive ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                <div className={`absolute top-[3px] w-3.5 h-3.5 rounded-full transition-all duration-200 bg-white
                                ${isActive ? 'left-[18px]' : 'left-[3px]'}`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-slate-700 flex items-center gap-1.5">
                  <span>{def.icon}</span> {def.label}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {def.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
