import { LoaderCircle, type LucideIcon } from "lucide-react"
import type { ButtonHTMLAttributes, ReactNode } from "react"

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white shadow-sm hover:bg-brand-strong focus-visible:ring-brand/30",
  secondary:
    "border border-line bg-white text-ink hover:border-brand/40 hover:bg-brand-soft focus-visible:ring-brand/20",
  ghost:
    "text-ink-muted hover:bg-surface-muted hover:text-ink focus-visible:ring-brand/20",
  danger: "bg-danger text-white hover:bg-red-600 focus-visible:ring-danger/20",
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: LucideIcon
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = "primary",
  icon: Icon,
  loading,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="size-4" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  )
}
