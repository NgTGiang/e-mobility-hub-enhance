import {
  ArrowLeft,
  BatteryMedium,
  Bike,
  Building2,
  CircleParking,
  Filter,
  List,
  Map,
  MapPin,
  Search,
  Siren,
  Wrench,
  Zap,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Link, useParams } from "react-router"
import {
  CapacityBar,
  DataTable,
  HubResourceStrip,
  IncidentStatusBadge,
  OperatorMetric,
  OperatorPageHeader,
  SeverityBadge,
  getHubMetrics,
  incidentTypeLabels,
} from "@/components/operator/OperatorUI"
import {
  BatteryIndicator,
  EmptyState,
  SelectField,
  hubStatusLabels,
  technicalLabels,
  vehicleStatusLabels,
  vehicleTypeLabels,
} from "@/components/student/StudentUI"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { TextInput } from "@/components/ui/TextInput"
import { useAppStore } from "@/store/appStore"
import type {
  OperationalStatus,
  TechnicalCondition,
  VehicleType,
  VehicleUsageStatus,
} from "@/types/domain"

export function NetworkMonitoringPage() {
  const { data } = useAppStore()
  const [selectedId, setSelectedId] = useState(data.hubs[0]?.id ?? "")
  const [status, setStatus] = useState<OperationalStatus | "ALL">("ALL")
  const [query, setQuery] = useState("")
  const [view, setView] = useState<"MAP" | "LIST">("MAP")
  const hubs = data.hubs.filter(
    (hub) =>
      (status === "ALL" || hub.operationalStatus === status) &&
      `${hub.name} ${hub.location}`.toLowerCase().includes(query.toLowerCase()),
  )
  const selected =
    data.hubs.find((item) => item.id === selectedId) ?? hubs[0]
  const metrics = selected ? getHubMetrics(data, selected.id) : null
  return (
    <div className="space-y-6">
      <OperatorPageHeader
        eyebrow="OP-02"
        title="Giám sát mạng lưới"
        description="Theo dõi vị trí, công suất và trạng thái tài nguyên trên toàn bộ Mobility Hub."
      />
      <Card>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_14rem_auto]">
          <TextInput
            label="Tìm Mobility Hub"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tên hoặc vị trí Hub..."
          />
          <SelectField
            label="Trạng thái vận hành"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as OperationalStatus | "ALL")
            }
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="OPERATIONAL">Đang hoạt động</option>
            <option value="LIMITED">Hoạt động hạn chế</option>
            <option value="UNAVAILABLE">Tạm ngưng</option>
          </SelectField>
          <div className="flex min-h-12 items-center gap-1 self-end rounded-xl bg-surface-muted p-1">
            <button
              className={`grid size-10 place-items-center rounded-lg ${view === "MAP" ? "bg-white text-info shadow-sm" : "text-ink-muted"}`}
              onClick={() => setView("MAP")}
              aria-label="Xem bản đồ"
              aria-pressed={view === "MAP"}
            ><Map className="size-4" /></button>
            <button
              className={`grid size-10 place-items-center rounded-lg ${view === "LIST" ? "bg-white text-info shadow-sm" : "text-ink-muted"}`}
              onClick={() => setView("LIST")}
              aria-label="Xem danh sách"
              aria-pressed={view === "LIST"}
            ><List className="size-4" /></button>
          </div>
        </CardContent>
      </Card>
      <div className="grid min-h-[38rem] gap-5 xl:grid-cols-[18rem_1fr_20rem]">
        <Card className="overflow-hidden">
          <CardHeader title="Mobility Hubs" description={`${hubs.length} Hub phù hợp`} />
          <div className="max-h-[34rem] space-y-2 overflow-y-auto p-3">
            {hubs.map((hub) => (
              <button
                key={hub.id}
                onClick={() => setSelectedId(hub.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selected?.id === hub.id
                    ? "border-info/30 bg-blue-50"
                    : "border-line hover:bg-surface-muted"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div><p className="text-sm font-semibold text-ink">{hub.name}</p><p className="mt-1 text-xs text-ink-muted">{hub.id}</p></div>
                  <span className={`mt-1 size-2 rounded-full ${hub.operationalStatus === "OPERATIONAL" ? "bg-success" : hub.operationalStatus === "LIMITED" ? "bg-warning" : "bg-danger"}`} />
                </div>
                <div className="mt-3"><CapacityBar value={Math.min(hub.utilization, 100)} compact /></div>
              </button>
            ))}
          </div>
        </Card>
        {view === "MAP" ? (
          <Card className="relative min-h-[38rem] overflow-hidden bg-slate-100">
            <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(#cbd5e1_1px,transparent_1px),linear-gradient(90deg,#cbd5e1_1px,transparent_1px)] [background-size:42px_42px]" />
            {hubs.map((hub, index) => (
              <button
                key={hub.id}
                onClick={() => setSelectedId(hub.id)}
                className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-xl border p-3 text-left shadow-lg transition ${
                  selected?.id === hub.id
                    ? "border-info bg-blue-50 ring-4 ring-info/10"
                    : "border-line bg-white"
                }`}
                style={{
                  left: `${18 + (index % 3) * 32}%`,
                  top: `${24 + Math.floor(index / 3) * 50}%`,
                }}
              >
                <div className="flex items-center gap-2"><MapPin className={`size-5 ${hub.utilization > 80 ? "text-danger" : "text-info"}`} /><div><p className="max-w-32 text-xs font-semibold text-ink">{hub.name.replace("Mobility Hub ", "")}</p><p className="text-[10px] text-ink-muted">{Math.min(hub.utilization, 100)}% sử dụng</p></div></div>
              </button>
            ))}
          </Card>
        ) : (
          <Card>
            <CardHeader title="Danh sách công suất" />
            <CardContent className="space-y-5">
              {hubs.map((hub) => (
                <button className="block w-full text-left" onClick={() => setSelectedId(hub.id)} key={hub.id}>
                  <div className="mb-2 flex justify-between gap-4"><span className="text-sm font-semibold text-ink">{hub.name}</span><span className="text-sm font-bold text-ink">{Math.min(hub.utilization, 100)}%</span></div><CapacityBar value={Math.min(hub.utilization, 100)} compact />
                </button>
              ))}
            </CardContent>
          </Card>
        )}
        <Card>
          {selected && metrics ? (
            <>
              <CardHeader title={selected.name} description={selected.location} />
              <CardContent className="space-y-5">
                <Badge tone={selected.operationalStatus === "OPERATIONAL" ? "success" : "warning"}>{hubStatusLabels[selected.operationalStatus]}</Badge>
                <HubResourceStrip data={data} hubId={selected.id} />
                <CapacityBar value={metrics.parkingUsage} label="Công suất đỗ" />
                <CapacityBar value={metrics.chargingUsage} label="Công suất sạc" />
                {selected.utilization > 80 ? <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">Hub có nguy cơ quá tải, cần xem xét điều phối.</div> : null}
                <Link className="button-primary w-full" to={`/operator/hubs/${selected.id}`}>Mở chi tiết Hub</Link>
                <Link className="button-secondary w-full" to={`/operator/redistribution?source=${selected.id}`}>Điều phối phương tiện</Link>
              </CardContent>
            </>
          ) : null}
        </Card>
      </div>
    </div>
  )
}

export function OperatorHubDetailsPage() {
  const { id } = useParams()
  const { data } = useAppStore()
  const [tab, setTab] = useState<"OVERVIEW" | "VEHICLES" | "PARKING" | "CHARGING" | "INCIDENTS">("OVERVIEW")
  const hub = data.hubs.find((item) => item.id === id)
  if (!hub) return <EmptyState icon={Building2} title="Không tìm thấy Mobility Hub" description="Hub không tồn tại trong dữ liệu vận hành." />
  const metrics = getHubMetrics(data, hub.id)
  const incidents = data.incidents.filter((item) => item.hubId === hub.id)
  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink" to="/operator/network"><ArrowLeft className="size-4" /> Quay lại mạng lưới</Link>
      <OperatorPageHeader
        eyebrow={`${hub.id} • OP-03`}
        title="Giám sát Mobility Hub"
        description={`${hub.name} • ${hub.location}`}
        action={<Badge tone={hub.operationalStatus === "OPERATIONAL" ? "success" : "warning"}>{hubStatusLabels[hub.operationalStatus]}</Badge>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OperatorMetric icon={Bike} label="Phương tiện" value={`${metrics.availableVehicles}/${metrics.vehicles.length}`} helper="Khả dụng / tổng số" />
        <OperatorMetric icon={CircleParking} label="Chỗ đỗ" value={`${metrics.availableParking}/${metrics.parking.length}`} helper="Còn trống / tổng số" tone="blue" />
        <OperatorMetric icon={Zap} label="Cổng sạc" value={`${metrics.availableCharging}/${metrics.charging.length}`} helper="Khả dụng / tổng số" tone="amber" />
        <OperatorMetric icon={Siren} label="Sự cố" value={incidents.filter((item) => item.status !== "RESOLVED").length} helper="Chưa xử lý" tone="red" />
      </div>
      <div className="flex gap-2 overflow-x-auto border-b border-line pb-2">
        {[
          ["OVERVIEW", "Tổng quan"],
          ["VEHICLES", "Phương tiện"],
          ["PARKING", "Chỗ đỗ"],
          ["CHARGING", "Cổng sạc"],
          ["INCIDENTS", "Cảnh báo & sự cố"],
        ].map(([value, label]) => (
          <button key={value} aria-pressed={tab === value} onClick={() => setTab(value as typeof tab)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${tab === value ? "bg-blue-50 text-info" : "text-ink-muted hover:bg-surface-muted"}`}>{label}</button>
        ))}
      </div>
      <Card>
        <CardContent>
          {tab === "OVERVIEW" ? (
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-5"><CapacityBar value={Math.min(hub.utilization, 100)} label="Mức sử dụng tổng hợp" /><CapacityBar value={metrics.parkingUsage} label="Công suất đỗ" /><CapacityBar value={metrics.chargingUsage} label="Công suất sạc" /></div>
              <div><h2 className="font-semibold text-ink">Sự kiện gần đây</h2><div className="mt-4 space-y-3">{[...incidents.slice(0, 2).map((item) => `${item.id}: ${item.description}`), "Dữ liệu tài nguyên được đồng bộ lúc 08:30", "Kiểm tra công suất tự động hoàn tất"].map((text, index) => <div className="flex gap-3" key={text}><span className="mt-1.5 size-2 shrink-0 rounded-full bg-info" /><div><p className="text-sm text-ink">{text}</p><p className="mt-1 text-xs text-ink-muted">{index + 1} giờ trước</p></div></div>)}</div></div>
            </div>
          ) : null}
          {tab === "VEHICLES" ? <SimpleVehicleTable vehicles={metrics.vehicles} data={data} /> : null}
          {tab === "PARKING" ? <ResourceTiles items={metrics.parking.map((item) => ({ id: item.id, status: item.status }))} /> : null}
          {tab === "CHARGING" ? <ResourceTiles items={metrics.charging.map((item) => ({ id: item.id, status: item.status }))} /> : null}
          {tab === "INCIDENTS" ? (
            incidents.length ? <div className="space-y-3">{incidents.map((incident) => <Link className="flex items-center justify-between gap-4 rounded-xl border border-line p-4 hover:border-info/30" to={`/operator/incidents/${incident.id}`} key={incident.id}><div><p className="font-semibold text-ink">{incident.id} • {incidentTypeLabels[incident.type]}</p><p className="mt-1 text-sm text-ink-muted">{incident.description}</p></div><div className="flex gap-2"><SeverityBadge severity={incident.severity} /><IncidentStatusBadge status={incident.status} /></div></Link>)}</div> : <p className="py-10 text-center text-ink-muted">Hub không có sự cố được ghi nhận.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function ResourceTiles({ items }: { items: { id: string; status: string }[] }) {
  const labels: Record<string, string> = {
    AVAILABLE: "Khả dụng",
    RESERVED: "Đã đặt",
    OCCUPIED: "Đang sử dụng",
    CHARGING: "Đang sạc",
    UNAVAILABLE: "Không khả dụng",
  }
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{items.map((item) => <div className={`rounded-xl border p-4 text-center ${item.status === "AVAILABLE" ? "border-brand/30 bg-brand-soft/30" : item.status === "UNAVAILABLE" ? "border-red-200 bg-red-50" : "border-line bg-surface-muted"}`} key={item.id}><p className="text-sm font-semibold text-ink">{item.id}</p><p className="mt-1 text-xs text-ink-muted">{labels[item.status] ?? item.status}</p></div>)}</div>
}

function SimpleVehicleTable({ vehicles, data }: { vehicles: typeof data.vehicles; data: ReturnType<typeof useAppStore>["data"] }) {
  return <DataTable minWidth="min-w-[980px]"><thead><tr className="border-b border-line text-xs uppercase tracking-wider text-ink-muted"><th className="px-3 py-3">Mã xe</th><th className="px-3 py-3">Loại</th><th className="px-3 py-3">Mobility Hub</th><th className="px-3 py-3">Pin</th><th className="px-3 py-3">Kỹ thuật</th><th className="px-3 py-3">Trạng thái</th><th className="px-3 py-3">Cập nhật</th></tr></thead><tbody>{vehicles.map((vehicle) => <tr className="border-b border-line last:border-0" key={vehicle.id}><td className="px-3 py-4"><Link className="font-semibold text-info" to={`/operator/vehicles/${vehicle.id}`}>{vehicle.id}</Link></td><td className="px-3 py-4 text-sm">{vehicleTypeLabels[vehicle.type]}</td><td className="px-3 py-4 text-sm text-ink-muted">{data.hubs.find((hub) => hub.id === vehicle.currentHubId)?.name}</td><td className="px-3 py-4"><BatteryIndicator value={vehicle.batteryLevel} /></td><td className="px-3 py-4 text-sm">{technicalLabels[vehicle.technicalCondition]}</td><td className="px-3 py-4"><Badge tone={vehicle.usageStatus === "AVAILABLE" ? "success" : "warning"}>{vehicleStatusLabels[vehicle.usageStatus]}</Badge></td><td className="px-3 py-4 text-xs text-ink-muted">08:30 • 18/03/2026</td></tr>)}</tbody></DataTable>
}

export function VehicleMonitoringPage() {
  const { data } = useAppStore()
  const [query, setQuery] = useState("")
  const [hubId, setHubId] = useState("ALL")
  const [type, setType] = useState<VehicleType | "ALL">("ALL")
  const [battery, setBattery] = useState<"ALL" | "LOW" | "MEDIUM" | "HIGH">("ALL")
  const [condition, setCondition] = useState<TechnicalCondition | "ALL">("ALL")
  const [usage, setUsage] = useState<VehicleUsageStatus | "ALL">("ALL")
  const [sort, setSort] = useState<"ID" | "BATTERY">("ID")
  const vehicles = useMemo(
    () =>
      data.vehicles
        .filter(
          (vehicle) =>
            vehicle.id.toLowerCase().includes(query.toLowerCase()) &&
            (hubId === "ALL" || vehicle.currentHubId === hubId) &&
            (type === "ALL" || vehicle.type === type) &&
            (battery === "ALL" ||
              (battery === "LOW" && vehicle.batteryLevel < 40) ||
              (battery === "MEDIUM" &&
                vehicle.batteryLevel >= 40 &&
                vehicle.batteryLevel < 70) ||
              (battery === "HIGH" && vehicle.batteryLevel >= 70)) &&
            (condition === "ALL" || vehicle.technicalCondition === condition) &&
            (usage === "ALL" || vehicle.usageStatus === usage),
        )
        .sort((a, b) =>
          sort === "BATTERY"
            ? a.batteryLevel - b.batteryLevel
            : a.id.localeCompare(b.id),
        ),
    [battery, condition, data.vehicles, hubId, query, sort, type, usage],
  )
  return (
    <div className="space-y-6">
      <OperatorPageHeader eyebrow="OP-04" title="Giám sát phương tiện" description="Tìm kiếm, lọc và theo dõi trạng thái đội xe điện trên toàn mạng lưới." />
      <Card>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          <TextInput label="Tìm mã xe" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="EV-..." />
          <SelectField label="Mobility Hub" value={hubId} onChange={(event) => setHubId(event.target.value)}><option value="ALL">Tất cả Hub</option>{data.hubs.map((hub) => <option value={hub.id} key={hub.id}>{hub.name}</option>)}</SelectField>
          <SelectField label="Loại xe" value={type} onChange={(event) => setType(event.target.value as VehicleType | "ALL")}><option value="ALL">Tất cả loại</option>{Object.entries(vehicleTypeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</SelectField>
          <SelectField label="Mức pin" value={battery} onChange={(event) => setBattery(event.target.value as "ALL" | "LOW" | "MEDIUM" | "HIGH")}><option value="ALL">Tất cả mức pin</option><option value="LOW">Dưới 40%</option><option value="MEDIUM">40–69%</option><option value="HIGH">Từ 70%</option></SelectField>
          <SelectField label="Kỹ thuật" value={condition} onChange={(event) => setCondition(event.target.value as TechnicalCondition | "ALL")}><option value="ALL">Tất cả</option>{Object.entries(technicalLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</SelectField>
          <SelectField label="Sử dụng" value={usage} onChange={(event) => setUsage(event.target.value as VehicleUsageStatus | "ALL")}><option value="ALL">Tất cả</option>{Object.entries(vehicleStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</SelectField>
          <SelectField label="Sắp xếp" value={sort} onChange={(event) => setSort(event.target.value as "ID" | "BATTERY")}><option value="ID">Theo mã xe</option><option value="BATTERY">Pin thấp trước</option></SelectField>
        </CardContent>
      </Card>
      <Card>
        <CardHeader title="Danh sách đội xe" description={`${vehicles.length} phương tiện phù hợp`} />
        <CardContent className="!p-0">
          <SimpleVehicleTable vehicles={vehicles} data={data} />
        </CardContent>
      </Card>
    </div>
  )
}

export function OperatorVehicleDetailsPage() {
  const { id } = useParams()
  const { data } = useAppStore()
  const vehicle = data.vehicles.find((item) => item.id === id)
  if (!vehicle) return <EmptyState icon={Bike} title="Không tìm thấy phương tiện" description="Mã phương tiện không tồn tại." />
  const hub = data.hubs.find((item) => item.id === vehicle.currentHubId)
  const incidents = data.incidents.filter((item) => item.resourceId === vehicle.id)
  const eligible =
    vehicle.usageStatus === "AVAILABLE" &&
    vehicle.technicalCondition === "GOOD" &&
    !data.vehicleReservations.some(
      (item) =>
        item.resourceId === vehicle.id &&
        (item.status === "CONFIRMED" || item.status === "ACTIVE"),
    )
  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink" to="/operator/vehicles"><ArrowLeft className="size-4" /> Quay lại đội xe</Link>
      <OperatorPageHeader eyebrow={`${vehicle.id} • OP-05`} title="Thông tin phương tiện" description="Trang giám sát chỉ đọc, không cung cấp thao tác chỉnh sửa không được hỗ trợ." action={<Badge tone={eligible ? "success" : "warning"}>{eligible ? "Đủ điều kiện phân bổ" : "Không đủ điều kiện"}</Badge>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_.7fr]">
        <Card>
          <CardHeader title={`${vehicleTypeLabels[vehicle.type]} • ${vehicle.id}`} description={hub?.name ?? "Không xác định"} />
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <Detail label="Mức pin"><BatteryIndicator value={vehicle.batteryLevel} /></Detail>
            <Detail label="Trạng thái sử dụng" value={vehicleStatusLabels[vehicle.usageStatus]} />
            <Detail label="Tình trạng kỹ thuật" value={technicalLabels[vehicle.technicalCondition]} />
            <Detail label="Công-tơ-mét" value={`${vehicle.odometer.toLocaleString("vi-VN")} km`} />
            <Detail label="Biển số" value={vehicle.licensePlate ?? "Không áp dụng"} />
            <Detail label="Mobility Hub hiện tại" value={hub?.name ?? "Không xác định"} />
            <Detail label="Cập nhật cuối" value="08:30 • 18/03/2026" />
            <Detail label="Khả năng phân bổ" value={eligible ? "Có thể điều phối" : "Đang bị hạn chế"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Sự cố liên quan" description={`${incidents.length} bản ghi`} />
          <CardContent className="space-y-3">
            {incidents.length ? incidents.map((incident) => <Link className="block rounded-xl border border-line p-4 hover:border-info/30" to={`/operator/incidents/${incident.id}`} key={incident.id}><div className="flex items-center justify-between gap-3"><p className="font-semibold text-ink">{incident.id}</p><IncidentStatusBadge status={incident.status} /></div><p className="mt-2 text-sm text-ink-muted">{incident.description}</p></Link>) : <p className="py-8 text-center text-sm text-ink-muted">Không có sự cố liên quan.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Detail({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}</p><div className="mt-2 font-medium text-ink">{children ?? value}</div></div>
}
