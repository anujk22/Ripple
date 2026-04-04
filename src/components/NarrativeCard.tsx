interface NarrativeCardProps {
  narrative: string
}

export default function NarrativeCard({ narrative }: NarrativeCardProps) {
  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-500 mb-3">
        Analysis
      </div>
      <p className="text-[13px] leading-relaxed text-neutral-400">
        <span className="text-white font-medium text-base">{narrative.charAt(0)}</span>
        {narrative.slice(1)}
      </p>
    </div>
  )
}
