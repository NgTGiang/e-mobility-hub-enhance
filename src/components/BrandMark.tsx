import { Leaf, Zap } from "lucide-react"

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-sm">
        <Zap className="size-5" aria-hidden="true" />
        <Leaf
          className="absolute -right-1 -top-1 size-4 rounded-full bg-lime p-0.5 text-ink"
          aria-hidden="true"
        />
      </div>
      {!compact ? (
        <div className="leading-tight">
          <p className="font-bold tracking-tight text-ink">Smart E-Mobility</p>
          <p className="text-xs font-medium text-brand-strong">
            VNU-HCM Urban Area
          </p>
        </div>
      ) : null}
    </div>
  )
}
