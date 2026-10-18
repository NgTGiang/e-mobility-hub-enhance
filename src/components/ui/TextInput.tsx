import type { InputHTMLAttributes } from "react"

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function TextInput({
  label,
  error,
  id,
  className = "",
  ...props
}: TextInputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s/g, "-")
  const errorId = `${inputId}-error`
  return (
    <label
      className="grid gap-2 text-sm font-medium text-ink"
      htmlFor={inputId}
    >
      {label}
      <input
        id={inputId}
        className={`min-h-12 rounded-xl border bg-white px-3.5 text-base font-normal text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10 ${
          error ? "border-danger" : "border-line"
        } ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error ? (
        <span id={errorId} className="text-xs font-medium text-danger">
          {error}
        </span>
      ) : null}
    </label>
  )
}
