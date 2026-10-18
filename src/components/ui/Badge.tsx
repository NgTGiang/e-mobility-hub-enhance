import type { ReactNode } from "react"

type BadgeTone = "success" | "info" | "warning" | "danger" | "neutral"

const tones: Record<BadgeTone, string> = {
  success: "bg-brand-soft text-brand-strong",
  info: "bg-blue-50 text-info",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-danger",
  neutral: "bg-slate-100 text-slate-600",
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: BadgeTone
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  )
}
