import {
  AlertTriangle,
  BatteryCharging,
  Bike,
  CircleParking,
  Info,
  type LucideIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import type {
  AppState,
  Incident,
  IncidentStatus,
  Severity,
} from "@/types/domain"

export const severityLabels: Record<Severity, string> = {
  NORMAL: "Bình thường",
  WARNING: "Cảnh báo",
  CRITICAL: "Nghiêm trọng",
}

export const incidentStatusLabels: Record<IncidentStatus, string> = {
  OPEN: "Mới",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã xử lý",
}

export const incidentTypeLabels: Record<Incident["type"], string> = {
  VEHICLE_MALFUNCTION: "Hỏng phương tiện",
  CHARGING_POINT_FAILURE: "Lỗi cổng sạc",
  PARKING_RESOURCE_FAILURE: "Lỗi tài nguyên đỗ",
  HUB_OPERATIONAL_PROBLEM: "Sự cố vận hành Hub",
}

export function OperatorPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-info">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 max-w-3xl text-ink-muted">{description}</p>
      </div>
      {action}
    </section>
  )
}

export function getHubMetrics(data: AppState, hubId: string) {
  const vehicles = data.vehicles.filter((item) => item.currentHubId === hubId)
  const parking = data.parkingSpaces.filter((item) => item.hubId === hubId)
  const charging = data.chargingPoints.filter((item) => item.hubId === hubId)
  return {
    vehicles,
    parking,
    charging,
    availableVehicles: vehicles.filter(
      (item) =>
        item.usageStatus === "AVAILABLE" &&
        item.technicalCondition !== "MAJOR_DAMAGE",
    ).length,
    availableParking: parking.filter((item) => item.status === "AVAILABLE").length,
    availableCharging: charging.filter((item) => item.status === "AVAILABLE").length,
    parkingUsage: parking.length
      ? Math.round(
          (parking.filter((item) => item.status !== "AVAILABLE").length /
            parking.length) *
            100,
        )
      : 0,
    chargingUsage: charging.length
      ? Math.round(
          (charging.filter((item) => item.status !== "AVAILABLE").length /
            charging.length) *
            100,
        )
      : 0,
  }
}

export function CapacityBar({
  value,
  label,
  compact = false,
}: {
  value: number
  label?: string
  compact?: boolean
}) {
  const color =
    value >= 85 ? "bg-danger" : value >= 70 ? "bg-warning" : "bg-brand"
  return (
    <div>
      {label ? (
        <div className="mb-2 flex justify-between gap-3 text-xs text-ink-muted">
          <span>{label}</span><strong className="text-ink">{value}%</strong>
        </div>
      ) : null}
      <div className={`${compact ? "h-1.5" : "h-2"} overflow-hidden rounded-full bg-slate-100`}>
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  )
}

export function OperatorMetric({
  icon: Icon,
  label,
  value,
  helper,
  tone = "green",
}: {
  icon: LucideIcon
  label: string
  value: string | number
  helper: string
  tone?: "green" | "blue" | "amber" | "red"
}) {
  const colors = {
    green: "bg-brand-soft text-brand",
    blue: "bg-blue-50 text-info",
    amber: "bg-amber-50 text-warning",
    red: "bg-red-50 text-danger",
  }
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className={`grid size-11 place-items-center rounded-xl ${colors[tone]}`}>
          <Icon className="size-5" />
        </span>
        <span className="text-xs font-semibold text-ink-muted">Mô phỏng</span>
      </div>
      <p className="mt-4 text-sm font-medium text-ink-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-xs text-ink-muted">{helper}</p>
    </Card>
  )
}

export function HubResourceStrip({
  data,
  hubId,
}: {
  data: AppState
  hubId: string
}) {
  const metrics = getHubMetrics(data, hubId)
  return (
    <div className="grid grid-cols-3 gap-2">
      <ResourceMini icon={Bike} value={metrics.availableVehicles} label="Xe" />
      <ResourceMini
        icon={CircleParking}
        value={metrics.availableParking}
        label="Chỗ đỗ"
      />
      <ResourceMini
        icon={BatteryCharging}
        value={metrics.availableCharging}
        label="Sạc"
      />
    </div>
  )
}

function ResourceMini({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon
  value: number
  label: string
}) {
  return (
    <div className="rounded-lg bg-surface-muted p-2 text-center">
      <Icon className="mx-auto size-4 text-info" />
      <p className="mt-1 text-sm font-bold text-ink">{value}</p>
      <p className="text-[10px] text-ink-muted">{label}</p>
    </div>
  )
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge
      tone={
        severity === "CRITICAL"
          ? "danger"
          : severity === "WARNING"
            ? "warning"
            : "success"
      }
    >
      {severityLabels[severity]}
    </Badge>
  )
}

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <Badge
      tone={
        status === "RESOLVED"
          ? "success"
          : status === "IN_PROGRESS"
            ? "info"
            : "warning"
      }
    >
      {incidentStatusLabels[status]}
    </Badge>
  )
}

export function OperatorNotice({
  tone,
  children,
}: {
  tone: "info" | "warning" | "error" | "success"
  children: ReactNode
}) {
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-brand/20 bg-brand-soft text-brand-strong",
  }
  const Icon = tone === "warning" || tone === "error" ? AlertTriangle : Info
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${styles[tone]}`} role="status">
      <Icon className="mt-0.5 size-4 shrink-0" />
      {children}
    </div>
  )
}

export function DataTable({
  children,
  minWidth = "min-w-[760px]",
}: {
  children: ReactNode
  minWidth?: string
}) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse text-left ${minWidth}`}>
        {children}
      </table>
    </div>
  )
}
