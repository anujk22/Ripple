interface PrioritySliderProps {
  priority: number
  onChange: (value: number) => void
}

export default function PrioritySlider({ priority, onChange }: PrioritySliderProps) {
  const label = priority < 35 ? 'Safety-focused' : priority > 65 ? 'Quality-of-life focused' : 'Balanced'

  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-500 mb-3">
        Stakeholder Priority
      </div>
      <div className="flex justify-between mb-2">
        <span className="text-[11px] text-neutral-500">🛡️ Safety</span>
        <span className="text-[11px] text-neutral-500">Quality of Life 🌿</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={priority}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Stakeholder priority"
        className="w-full"
      />
      <div className="text-center mt-2 text-xs text-neutral-400">{label}</div>
    </div>
  )
}
