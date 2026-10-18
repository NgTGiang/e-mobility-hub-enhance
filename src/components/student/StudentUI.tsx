import {
  BatteryMedium,
  Bike,
  CarFront,
  CheckCircle2,
  CircleAlert,
  CloudRain,
  Info,
  MapPin,
  Motorbike,
  type LucideIcon,
} from "lucide-react"
import type { ReactNode, SelectHTMLAttributes } from "react"
import { Link } from "react-router"
import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import type {
  ChargingPointStatus,
  ChargingRequestStatus,
  OperationalStatus,
  ParkingStatus,
  ReservationStatus,
  TechnicalCondition,
  Vehicle,
  VehicleType,
  VehicleUsageStatus,
} from "@/types/domain"

export const vehicleTypeLabels: Record<VehicleType, string> = {
  ELECTRIC_BICYCLE: "Xe đạp điện",
  ELECTRIC_MOTORCYCLE: "Xe máy điện",
  ELECTRIC_CAR: "Ô tô điện",
}

export const technicalLabels: Record<TechnicalCondition, string> = {
  GOOD: "Tốt",
  MINOR_DAMAGE: "Hư hỏng nhẹ",
  MAJOR_DAMAGE: "Không đủ điều kiện",
}

export const vehicleStatusLabels: Record<VehicleUsageStatus, string> = {
  AVAILABLE: "Khả dụng",
  RESERVED: "Đã đặt",
  IN_USE: "Đang sử dụng",
}

export const parkingStatusLabels: Record<ParkingStatus, string> = {
  AVAILABLE: "Còn trống",
  RESERVED: "Đã đặt",
  OCCUPIED: "Đang sử dụng",
  UNAVAILABLE: "Không khả dụng",
}

export const chargingStatusLabels: Record<ChargingPointStatus, string> = {
  AVAILABLE: "Khả dụng",
  RESERVED: "Đã đặt",
  CHARGING: "Đang sạc",
  UNAVAILABLE: "Không khả dụng",
}

export const requestStatusLabels: Record<ChargingRequestStatus, string> = {
  ACCEPTED: "Đã tiếp nhận",
  PENDING: "Chờ xếp lịch",
  SCHEDULED: "Đã xếp lịch",
  CHARGING: "Đang sạc",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
}

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  ACTIVE: "Đang hoạt động",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
}

export const hubStatusLabels: Record<OperationalStatus, string> = {
  OPERATIONAL: "Đang hoạt động",
  LIMITED: "Hoạt động hạn chế",
  UNAVAILABLE: "Tạm ngưng",
}

export function vehicleIcon(type: VehicleType): LucideIcon {
  if (type === "ELECTRIC_CAR") return CarFront
  if (type === "ELECTRIC_MOTORCYCLE") return Motorbike
  return Bike
}

export function statusTone(
  status: VehicleUsageStatus | ParkingStatus | ChargingPointStatus | ChargingRequestStatus | ReservationStatus,
) {
  if (["AVAILABLE", "COMPLETED", "ACTIVE"].includes(status)) return "success" as const
  if (["RESERVED", "SCHEDULED", "CONFIRMED", "CHARGING"].includes(status)) return "info" as const
  if (["PENDING", "ACCEPTED", "OCCUPIED"].includes(status)) return "warning" as const
  if (status === "UNAVAILABLE") return "danger" as const
  return "neutral" as const
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-wider text-brand">{eyebrow}</p> : null}
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 max-w-3xl text-ink-muted">{description}</p>
      </div>
      {action}
    </section>
  )
}

export function SelectField({
  label,
  children,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  children: ReactNode
}) {
  return (
    <label className={`grid gap-2 text-sm font-medium text-ink ${className}`}>
      {label}
      <select
        className="min-h-12 rounded-xl border border-line bg-white px-3.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
        {...props}
      >
        {children}
      </select>
    </label>
  )
}

export function BatteryIndicator({ value }: { value: number }) {
  const tone = value < 30 ? "bg-danger" : value < 55 ? "bg-warning" : "bg-brand"
  return (
    <div className="flex items-center gap-2" aria-label={`Pin ${value}%`}>
      <BatteryMedium className="size-4 text-ink-muted" />
      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-sm font-semibold text-ink">{value}%</span>
    </div>
  )
}

export function VehicleVisual({ vehicle, compact = false }: { vehicle: Vehicle; compact?: boolean }) {
  const Icon = vehicleIcon(vehicle.type)
  return (
    <div
      className={`relative grid place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-soft via-white to-blue-50 ${
        compact ? "h-28" : "h-48"
      }`}
    >
      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-brand-strong shadow-sm">
        100% điện
      </span>
      <span className={`${compact ? "size-16" : "size-24"} grid place-items-center rounded-full bg-white text-brand shadow-lg`}>
        <Icon className={compact ? "size-8" : "size-12"} strokeWidth={1.6} />
      </span>
      <span className="absolute bottom-3 right-4 text-xs font-bold text-ink-muted">{vehicle.id}</span>
    </div>
  )
}

export function VehicleCard({
  vehicle,
  hubName,
  recommendation,
}: {
  vehicle: Vehicle
  hubName: string
  recommendation?: string
}) {
  return (
    <Card className="overflow-hidden transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg">
      <VehicleVisual vehicle={vehicle} compact />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{vehicle.id}</p>
            <h2 className="mt-1 font-semibold text-ink">{vehicleTypeLabels[vehicle.type]}</h2>
          </div>
          <Badge tone={statusTone(vehicle.usageStatus)}>{vehicleStatusLabels[vehicle.usageStatus]}</Badge>
        </div>
        {recommendation ? (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-brand-soft px-2.5 py-2 text-xs font-semibold text-brand-strong">
            {recommendation.includes("mưa") ? <CloudRain className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
            {recommendation}
          </p>
        ) : null}
        <div className="mt-4 space-y-3">
          <BatteryIndicator value={vehicle.batteryLevel} />
          <p className="flex items-center gap-2 text-sm text-ink-muted"><MapPin className="size-4" /> {hubName}</p>
          <div className="flex items-center justify-between border-t border-line pt-3">
            <span className="text-xs text-ink-muted">{technicalLabels[vehicle.technicalCondition]}</span>
            <Link className="text-sm font-semibold text-brand hover:text-brand-strong" to={`/student/vehicles/${vehicle.id}`}>Xem chi tiết</Link>
          </div>
        </div>
      </div>
    </Card>
  )
}

export function Notice({
  tone,
  children,
}: {
  tone: "success" | "error" | "info" | "warning"
  children: ReactNode
}) {
  const styles = {
    success: "border-brand/20 bg-brand-soft text-brand-strong",
    error: "border-red-200 bg-red-50 text-red-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
  }
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? CircleAlert : Info
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${styles[tone]}`} role="status">
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <Card className="grid min-h-80 place-items-center p-8 text-center">
      <div>
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-surface-muted text-ink-muted">
          <Icon className="size-8" />
        </span>
        <h2 className="mt-5 text-xl font-semibold text-ink">{title}</h2>
        <p className="mx-auto mt-2 max-w-md leading-6 text-ink-muted">{description}</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </Card>
  )
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

export function futureLocalDateTime(hoursAhead: number) {
  const date = new Date(Date.now() + hoursAhead * 60 * 60 * 1000)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)
  return local.toISOString().slice(0, 16)
}
