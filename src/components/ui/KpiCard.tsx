import { ArrowUpRight, type LucideIcon } from "lucide-react"
import { Card } from "./Card"

export function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "green",
}: {
  label: string
  value: string | number
  helper: string
  icon: LucideIcon
  tone?: "green" | "blue" | "amber" | "red"
}) {
  const colors = {
    green: "bg-brand-soft text-brand",
    blue: "bg-blue-50 text-info",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-danger",
  }
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div
          className={`grid size-11 place-items-center rounded-xl ${colors[tone]}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <ArrowUpRight className="size-4 text-slate-300" aria-hidden="true" />
      </div>
      <p className="mt-5 text-sm font-medium text-ink-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-xs text-ink-muted">{helper}</p>
    </Card>
  )
}
