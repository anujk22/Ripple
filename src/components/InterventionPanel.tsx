import interventionDefs from '../data/interventions'

interface InterventionPanelProps {
  availableIds: string[]
  activeInterventions: string[]
  onToggle: (id: string) => void
}

export default function InterventionPanel({ availableIds, activeInterventions, onToggle }: InterventionPanelProps) {
  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-500 mb-3">
        Interventions
      </div>
      <div className="flex flex-col gap-2">
        {availableIds.map((id) => {
          const def = interventionDefs[id]
          if (!def) return null
          const isActive = activeInterventions.includes(id)

          return (
            <button
              key={id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left
                          transition-all duration-200 cursor-pointer group
                          ${isActive
                            ? 'bg-white/[0.04] border-white/20'
                            : 'bg-white/[0.01] border-white/[0.06] hover:bg-white/[0.03] hover:border-white/10'
                          }`}
              onClick={() => onToggle(id)}
              role="switch"
              aria-checked={isActive}
            >
              {/* Toggle switch */}
              <div className={`w-9 h-5 rounded-full relative flex-shrink-0 transition-colors duration-200
                              ${isActive ? 'bg-white' : 'bg-neutral-700'}`}>
                <div className={`absolute top-[3px] w-3.5 h-3.5 rounded-full transition-all duration-200
                                ${isActive
                                  ? 'left-[18px] bg-black'
                                  : 'left-[3px] bg-neutral-400'
                                }`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-neutral-200 flex items-center gap-1.5">
                  <span>{def.icon}</span> {def.label}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
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
