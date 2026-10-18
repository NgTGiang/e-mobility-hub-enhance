import type { ReactNode } from "react"

export function Card({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-2xl border border-line bg-white shadow-card ${className}`}
    >
      {children}
    </section>
  )
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div>
        <h2 className="font-semibold text-ink">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

export function CardContent({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`p-5 ${className}`}>{children}</div>
}
