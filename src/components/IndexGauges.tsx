import type { Indices } from '../data/scenarios'
import { computeAlignmentScore } from '../data/engine'

interface IndexConfig {
  label: string
  icon: string
  inverted: boolean
  description: string
}

const INDEX_CONFIG: Record<keyof Indices, IndexConfig> = {
  heat: {
    label: 'Heat Exposure',
    icon: '🌡️',
    inverted: true,
    description: 'Surface temperature and urban heat island intensity. Lower is better.',
  },
  emissions: {
    label: 'Car Emissions',
    icon: '💨',
    inverted: true,
    description: 'Traffic-related air pollution from everyday vehicle use. Lower is better.',
  },
  evacuation: {
    label: 'Evacuation Difficulty',
    icon: '🚨',
    inverted: true,
    description: 'How hard it is to evacuate by vehicle during emergencies. Lower is better.',
  },
  healthAccess: {
    label: 'Health Access',
    icon: '❤️',
    inverted: false,
    description: 'Ease of reaching healthcare on foot or nearby. Higher is better.',
  },
}

interface IndexGaugesProps {
  indices: Indices
  baseIndices: Indices
  priority: number
}

export default function IndexGauges({ indices, baseIndices, priority }: IndexGaugesProps) {
  const alignment = computeAlignmentScore(indices, priority)

  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-500 mb-4">
        Trade-Off Indices
      </div>
      <div className="flex flex-col gap-4">
        {(Object.keys(INDEX_CONFIG) as (keyof Indices)[]).map((key) => {
          const config = INDEX_CONFIG[key]
          const value = indices[key]
          const base = baseIndices[key]
          const delta = value - base

          const isGood = key === 'healthAccess' ? delta > 0 : delta < 0
          const deltaColor = delta === 0
            ? 'text-neutral-600'
            : isGood
              ? 'text-white bg-white/10'
              : 'text-neutral-400 bg-white/5'

          return (
            <div key={key} className="group">
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-[13px] font-medium text-neutral-300 flex items-center gap-1.5">
                  {config.icon} {config.label}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[13px] font-semibold tabular-nums text-white">
                    {value}
                  </span>
                  {delta !== 0 && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${deltaColor}`}>
                      {delta > 0 ? '+' : ''}{delta}
                    </span>
                  )}
                </span>
              </div>

              {/* Bar */}
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${value}%`,
                    background: `linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,${value > 60 ? 0.6 : 0.35}))`,
                  }}
                />
                {/* Baseline marker */}
                <div
                  className="absolute top-[-2px] bottom-[-2px] w-[2px] bg-white/30 rounded-sm"
                  style={{ left: `${base}%` }}
                  title={`Baseline: ${base}`}
                />
              </div>

              {/* Hover description */}
              <p className="text-[10px] text-neutral-600 mt-1 leading-snug opacity-0 group-hover:opacity-100 transition-opacity">
                {config.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Alignment score */}
      <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-center gap-3">
        <div className="text-center">
          <div className="text-3xl font-bold text-white tabular-nums leading-none">{alignment}</div>
          <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-neutral-500 mt-1">
            Alignment
          </div>
        </div>
      </div>
    </div>
  )
}
