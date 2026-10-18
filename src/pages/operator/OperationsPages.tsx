import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Building2,
  CheckCircle2,
  CircleParking,
  ClipboardCheck,
  MapPin,
  Search,
  Send,
  ShieldCheck,
  Siren,
  TriangleAlert,
  Wrench,
  Zap,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Link, useParams } from "react-router"
import {
  CapacityBar,
  DataTable,
  IncidentStatusBadge,
  OperatorMetric,
  OperatorNotice,
  OperatorPageHeader,
  SeverityBadge,
  getHubMetrics,
  incidentStatusLabels,
  incidentTypeLabels,
  severityLabels,
} from "@/components/operator/OperatorUI"
import {
  EmptyState,
  SelectField,
  chargingStatusLabels,
  formatDateTime,
  hubStatusLabels,
  parkingStatusLabels,
  technicalLabels,
  vehicleStatusLabels,
  vehicleTypeLabels,
} from "@/components/student/StudentUI"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { TextInput } from "@/components/ui/TextInput"
import { useAppStore } from "@/store/appStore"
import type { IncidentStatus, Severity } from "@/types/domain"

export function CapacityAlertsPage() {
  const { data } = useAppStore()
  const [severity, setSeverity] = useState<Severity | "ALL">("ALL")
  const alerts = data.alerts.filter(
    (item) => severity === "ALL" || item.severity === severity,
  )
  return (
    <div className="space-y-6">
      <OperatorPageHeader
        eyebrow="OP-09"
        title="Cảnh báo quá tải"
        description="Phân tích công suất đỗ, áp lực sạc và mất cân bằng phương tiện theo Hub."
        action={
          <Link className="button-primary" to="/operator/redistribution">
            Điều phối phương tiện
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <OperatorMetric
          icon={TriangleAlert}
          label="Nghiêm trọng"
          value={data.alerts.filter((item) => item.severity === "CRITICAL").length}
          helper="Cần hành động sớm"
          tone="red"
        />
        <OperatorMetric
          icon={Siren}
          label="Cảnh báo"
          value={data.alerts.filter((item) => item.severity === "WARNING").length}
          helper="Đang theo dõi"
          tone="amber"
        />
        <OperatorMetric
          icon={CheckCircle2}
          label="Bình thường"
          value={data.hubs.filter((hub) => hub.utilization < 70).length}
          helper="Hub trong ngưỡng ổn định"
        />
      </div>
      <Card>
        <CardContent>
          <SelectField
            className="max-w-sm"
            label="Mức độ"
            value={severity}
            onChange={(event) =>
              setSeverity(event.target.value as Severity | "ALL")
            }
          >
            <option value="ALL">Tất cả mức độ</option>
            <option value="CRITICAL">Nghiêm trọng</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="NORMAL">Bình thường</option>
          </SelectField>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {alerts.map((alert) => {
          const hub = data.hubs.find((item) => item.id === alert.hubId)!
          const metrics = getHubMetrics(data, hub.id)
          const imbalance =
            metrics.availableVehicles <= 1
              ? "Thiếu phương tiện"
              : metrics.availableVehicles >= 4
                ? "Dư phương tiện"
                : "Cân bằng"
          return (
            <Card key={alert.id}>
              <CardContent className="grid gap-5 xl:grid-cols-[1fr_1.2fr_auto] xl:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-ink">{hub.name}</h2>
                    <SeverityBadge severity={alert.severity} />
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">{alert.message}</p>
                  <p className="mt-2 text-xs text-ink-muted">
                    Phát hiện: {formatDateTime(alert.detectedAt)}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div><CapacityBar value={metrics.parkingUsage} label="Công suất đỗ" /></div>
                  <div><CapacityBar value={metrics.chargingUsage} label="Áp lực sạc" /></div>
                  <div><p className="mb-2 text-xs text-ink-muted">Phân bố xe</p><Badge tone={imbalance === "Cân bằng" ? "success" : "warning"}>{imbalance}</Badge></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="button-secondary" to={`/operator/hubs/${hub.id}`}>Xem Hub</Link>
                  <Link className="button-secondary" to="/operator/resources">Xem tài nguyên</Link>
                  <Link className="button-primary" to={`/operator/redistribution?source=${hub.id}`}>Điều phối</Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export function VehicleDispatchingPage() {
  const { data, dispatchVehicles } = useAppStore()
  const query = new URLSearchParams(window.location.search)
  const [step, setStep] = useState(1)
  const [sourceId, setSourceId] = useState(query.get("source") ?? "")
  const [destinationId, setDestinationId] = useState(
    query.get("destination") ?? "",
  )
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null)
  const source = data.hubs.find((item) => item.id === sourceId)
  const destination = data.hubs.find((item) => item.id === destinationId)
  const eligibleVehicles = data.vehicles.filter(
    (vehicle) =>
      vehicle.currentHubId === sourceId &&
      vehicle.usageStatus === "AVAILABLE" &&
      vehicle.technicalCondition === "GOOD" &&
      !data.vehicleReservations.some(
        (reservation) =>
          reservation.resourceId === vehicle.id &&
          (reservation.status === "CONFIRMED" ||
            reservation.status === "ACTIVE"),
      ),
  )
  const sourceMetrics = source ? getHubMetrics(data, source.id) : null
  const destinationMetrics = destination
    ? getHubMetrics(data, destination.id)
    : null
  const destinationCapacity = destination
    ? data.parkingSpaces.filter(
        (item) =>
          item.hubId === destination.id && item.status === "AVAILABLE",
      ).length
    : 0
  const hasCompatibleDestinationSpaces = (() => {
    const spaces = data.parkingSpaces.filter(
      (item) =>
        item.hubId === destinationId && item.status === "AVAILABLE",
    )
    return selectedIds.every((id) => {
      const vehicle = data.vehicles.find((item) => item.id === id)
      const index = spaces.findIndex(
        (space) =>
          vehicle && space.compatibleVehicleTypes.includes(vehicle.type),
      )
      if (index < 0) return false
      spaces.splice(index, 1)
      return true
    })
  })()
  const sourceOccupancy = source
    ? data.parkingSpaces.filter(
        (item) =>
          item.hubId === source.id &&
          item.status === "OCCUPIED" &&
          !item.currentReservationId,
      ).length
    : 0
  const canPreview =
    sourceId &&
    destinationId &&
    sourceId !== destinationId &&
    selectedIds.length > 0 &&
    selectedIds.length <= destinationCapacity &&
    selectedIds.length <= sourceOccupancy &&
    hasCompatibleDestinationSpaces

  const toggleVehicle = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  const confirm = () => {
    if (!window.confirm(`Xác nhận điều phối ${selectedIds.length} phương tiện?`)) return
    const result = dispatchVehicles({
      sourceHubId: sourceId,
      destinationHubId: destinationId,
      vehicleIds: selectedIds,
    })
    setNotice(result)
    if (result.ok) setStep(4)
  }

  return (
    <div className="space-y-6">
      <OperatorPageHeader
        eyebrow="OP-10"
        title="Điều phối phương tiện"
        description="Workflow xác thực nguồn, đích, điều kiện xe và công suất đỗ trước khi cập nhật mạng lưới."
      />
      <div className="grid grid-cols-4 gap-2">
        {["Chọn Hub", "Chọn xe", "Xác nhận", "Kết quả"].map((label, index) => (
          <div key={label}>
            <div className={`h-1.5 rounded-full ${step >= index + 1 ? "bg-info" : "bg-slate-200"}`} />
            <p className={`mt-2 text-xs font-semibold ${step >= index + 1 ? "text-info" : "text-ink-muted"}`}>{index + 1}. {label}</p>
          </div>
        ))}
      </div>
      {notice ? <OperatorNotice tone={notice.ok ? "success" : "error"}>{notice.message}</OperatorNotice> : null}
      {step === 1 ? (
        <Card>
          <CardHeader title="Chọn Hub nguồn và Hub đích" description="Hai Hub phải khác nhau và đang hoạt động." />
          <CardContent className="grid gap-5 md:grid-cols-2">
            <SelectField label="Hub nguồn" value={sourceId} onChange={(event) => { setSourceId(event.target.value); setSelectedIds([]) }}><option value="">Chọn Hub nguồn</option>{data.hubs.map((hub) => <option value={hub.id} key={hub.id}>{hub.name}</option>)}</SelectField>
            <SelectField label="Hub đích" value={destinationId} onChange={(event) => setDestinationId(event.target.value)}><option value="">Chọn Hub đích</option>{data.hubs.filter((hub) => hub.id !== sourceId).map((hub) => <option value={hub.id} key={hub.id}>{hub.name}</option>)}</SelectField>
            {source && destination ? <div className="md:col-span-2 grid gap-4 md:grid-cols-2"><HubBalanceCard title="Hub nguồn" hubName={source.name} vehicles={sourceMetrics?.vehicles.length ?? 0} parking={sourceMetrics?.availableParking ?? 0} /><HubBalanceCard title="Hub đích" hubName={destination.name} vehicles={destinationMetrics?.vehicles.length ?? 0} parking={destinationMetrics?.availableParking ?? 0} /></div> : null}
            <div className="md:col-span-2 flex justify-end"><Button disabled={!sourceId || !destinationId || sourceId === destinationId} onClick={() => setStep(2)}>Tiếp tục chọn xe <ArrowRight className="size-4" /></Button></div>
          </CardContent>
        </Card>
      ) : null}
      {step === 2 ? (
        <Card>
          <CardHeader title="Chọn phương tiện đủ điều kiện" description={`${eligibleVehicles.length} xe khả dụng, kỹ thuật tốt và không có lượt đặt hợp lệ`} />
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {eligibleVehicles.map((vehicle) => (
                <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${selectedIds.includes(vehicle.id) ? "border-info bg-blue-50" : "border-line"}`} key={vehicle.id}>
                  <input type="checkbox" className="size-4 accent-blue-600" checked={selectedIds.includes(vehicle.id)} onChange={() => toggleVehicle(vehicle.id)} />
                  <div className="flex-1"><p className="font-semibold text-ink">{vehicle.id}</p><p className="mt-1 text-xs text-ink-muted">{vehicleTypeLabels[vehicle.type]} • Pin {vehicle.batteryLevel}%</p></div>
                  <ShieldCheck className="size-5 text-brand" />
                </label>
              ))}
            </div>
            {!eligibleVehicles.length ? <OperatorNotice tone="warning">Hub nguồn không có xe đủ điều kiện điều phối.</OperatorNotice> : null}
            <div className="flex flex-col justify-between gap-3 border-t border-line pt-4 sm:flex-row sm:items-center"><p className="text-sm text-ink-muted">Đã chọn <strong className="text-ink">{selectedIds.length}</strong> • Giới hạn bảo toàn chỗ đỗ nguồn: {sourceOccupancy}</p><div className="flex gap-2"><Button variant="secondary" onClick={() => setStep(1)}>Quay lại</Button><Button disabled={!selectedIds.length} onClick={() => setStep(3)}>Kiểm tra điều kiện</Button></div></div>
          </CardContent>
        </Card>
      ) : null}
      {step === 3 ? (
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <HubBalanceCard title="Trước điều phối • Nguồn" hubName={source?.name ?? ""} vehicles={sourceMetrics?.vehicles.length ?? 0} parking={sourceMetrics?.availableParking ?? 0} afterVehicles={(sourceMetrics?.vehicles.length ?? 0) - selectedIds.length} afterParking={(sourceMetrics?.availableParking ?? 0) + selectedIds.length} />
            <HubBalanceCard title="Trước điều phối • Đích" hubName={destination?.name ?? ""} vehicles={destinationMetrics?.vehicles.length ?? 0} parking={destinationMetrics?.availableParking ?? 0} afterVehicles={(destinationMetrics?.vehicles.length ?? 0) + selectedIds.length} afterParking={(destinationMetrics?.availableParking ?? 0) - selectedIds.length} />
          </div>
          <Card><CardHeader title="Kết quả kiểm tra tài nguyên" /><CardContent className="space-y-3">{[
            ["Xe không được đặt hoặc sử dụng", selectedIds.every((id) => eligibleVehicles.some((vehicle) => vehicle.id === id))],
            ["Điều kiện kỹ thuật đạt yêu cầu", selectedIds.every((id) => data.vehicles.find((vehicle) => vehicle.id === id)?.technicalCondition === "GOOD")],
            [`Hub đích còn ít nhất ${selectedIds.length} chỗ tương thích`, destinationCapacity >= selectedIds.length && hasCompatibleDestinationSpaces],
            ["Phân bổ chỗ đỗ nguồn nhất quán", sourceOccupancy >= selectedIds.length],
          ].map(([label, valid]) => <div className="flex items-center justify-between rounded-xl bg-surface-muted p-3" key={String(label)}><span className="text-sm font-medium text-ink">{String(label)}</span><Badge tone={valid ? "success" : "danger"}>{valid ? "Đạt" : "Không đạt"}</Badge></div>)}<div className="flex justify-end gap-2 pt-3"><Button variant="secondary" onClick={() => setStep(2)}>Quay lại</Button><Button disabled={!canPreview} onClick={confirm}>Xác nhận điều phối</Button></div></CardContent></Card>
        </div>
      ) : null}
      {step === 4 ? (
        <Card className="grid min-h-96 place-items-center p-8 text-center"><div><span className="mx-auto grid size-20 place-items-center rounded-3xl bg-brand-soft text-brand"><CheckCircle2 className="size-10" /></span><h2 className="mt-5 text-2xl font-bold text-ink">Điều phối hoàn tất</h2><p className="mx-auto mt-2 max-w-xl text-ink-muted">{notice?.message}</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link className="button-secondary" to="/operator/network">Xem mạng lưới</Link><Button onClick={() => { setStep(1); setSelectedIds([]); setNotice(null) }}>Tạo điều phối mới</Button></div></div></Card>
      ) : null}
    </div>
  )
}

function HubBalanceCard({ title, hubName, vehicles, parking, afterVehicles, afterParking }: { title: string; hubName: string; vehicles: number; parking: number; afterVehicles?: number; afterParking?: number }) {
  return <Card className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-info">{title}</p><h3 className="mt-2 font-semibold text-ink">{hubName}</h3><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-surface-muted p-3"><p className="text-xs text-ink-muted">Phương tiện</p><p className="mt-1 text-xl font-bold text-ink">{vehicles}{afterVehicles !== undefined ? <span className="text-sm text-info"> → {afterVehicles}</span> : null}</p></div><div className="rounded-xl bg-surface-muted p-3"><p className="text-xs text-ink-muted">Chỗ đỗ trống</p><p className="mt-1 text-xl font-bold text-ink">{parking}{afterParking !== undefined ? <span className="text-sm text-info"> → {afterParking}</span> : null}</p></div></div></Card>
}

export function IncidentManagementPage() {
  const { data } = useAppStore()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<IncidentStatus | "ALL">("ALL")
  const [severity, setSeverity] = useState<Severity | "ALL">("ALL")
  const incidents = data.incidents.filter(
    (incident) =>
      `${incident.id} ${incident.resourceId} ${incident.description}`.toLowerCase().includes(query.toLowerCase()) &&
      (status === "ALL" || incident.status === status) &&
      (severity === "ALL" || incident.severity === severity),
  )
  return (
    <div className="space-y-6">
      <OperatorPageHeader eyebrow="OP-12" title="Quản lý sự cố" description="Theo dõi sự cố kỹ thuật theo tài nguyên, Hub, mức độ và tiến độ xử lý." />
      <div className="grid gap-4 sm:grid-cols-3">
        <OperatorMetric icon={Siren} label="Sự cố mới" value={data.incidents.filter((item) => item.status === "OPEN").length} helper="Chưa tiếp nhận" tone="red" />
        <OperatorMetric icon={Wrench} label="Đang xử lý" value={data.incidents.filter((item) => item.status === "IN_PROGRESS").length} helper="Đang có người phụ trách" tone="amber" />
        <OperatorMetric icon={CheckCircle2} label="Đã xử lý" value={data.incidents.filter((item) => item.status === "RESOLVED").length} helper="Đã xác nhận kỹ thuật" />
      </div>
      <Card><CardContent className="grid gap-4 md:grid-cols-3"><TextInput label="Tìm sự cố hoặc tài nguyên" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="INC-..., EV-..." /><SelectField label="Trạng thái" value={status} onChange={(event) => setStatus(event.target.value as IncidentStatus | "ALL")}><option value="ALL">Tất cả trạng thái</option>{Object.entries(incidentStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</SelectField><SelectField label="Mức độ" value={severity} onChange={(event) => setSeverity(event.target.value as Severity | "ALL")}><option value="ALL">Tất cả mức độ</option>{Object.entries(severityLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</SelectField></CardContent></Card>
      <Card>
        <CardHeader title="Danh sách sự cố" description={`${incidents.length} bản ghi phù hợp`} />
        <CardContent className="!p-0">
          <DataTable>
            <thead><tr className="border-b border-line text-xs uppercase tracking-wider text-ink-muted"><th className="px-4 py-3">Mã sự cố</th><th className="px-4 py-3">Loại</th><th className="px-4 py-3">Tài nguyên</th><th className="px-4 py-3">Mobility Hub</th><th className="px-4 py-3">Mức độ</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Phát hiện</th></tr></thead>
            <tbody>{incidents.map((incident) => <tr className="border-b border-line last:border-0" key={incident.id}><td className="px-4 py-4"><Link className="font-semibold text-info" to={`/operator/incidents/${incident.id}`}>{incident.id}</Link></td><td className="px-4 py-4 text-sm text-ink">{incidentTypeLabels[incident.type]}</td><td className="px-4 py-4 text-sm font-medium text-ink">{incident.resourceId}</td><td className="px-4 py-4 text-sm text-ink-muted">{data.hubs.find((hub) => hub.id === incident.hubId)?.name}</td><td className="px-4 py-4"><SeverityBadge severity={incident.severity} /></td><td className="px-4 py-4"><IncidentStatusBadge status={incident.status} /></td><td className="px-4 py-4 text-xs text-ink-muted">{formatDateTime(incident.detectedAt)}</td></tr>)}</tbody>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  )
}

export function IncidentDetailsPage() {
  const { id } = useParams()
  const { data, startIncidentHandling, resolveIncident } = useAppStore()
  const [notes, setNotes] = useState("")
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null)
  const incident = data.incidents.find((item) => item.id === id)
  if (!incident) return <EmptyState icon={Siren} title="Không tìm thấy sự cố" description="Mã sự cố không tồn tại." />
  const hub = data.hubs.find((item) => item.id === incident.hubId)
  const resourceStatus =
    incident.resourceKind === "VEHICLE"
      ? technicalLabels[
          data.vehicles.find((item) => item.id === incident.resourceId)
            ?.technicalCondition ?? "GOOD"
        ]
      : incident.resourceKind === "CHARGING_POINT"
        ? chargingStatusLabels[
            data.chargingPoints.find(
              (item) => item.id === incident.resourceId,
            )?.status ?? "UNAVAILABLE"
          ]
        : incident.resourceKind === "PARKING_SPACE"
          ? parkingStatusLabels[
              data.parkingSpaces.find(
                (item) => item.id === incident.resourceId,
              )?.status ?? "UNAVAILABLE"
            ]
          : hubStatusLabels[hub?.operationalStatus ?? "UNAVAILABLE"]
  const start = () => setNotice(startIncidentHandling(incident.id))
  const resolve = () => {
    if (!window.confirm("Xác nhận đã kiểm tra kỹ thuật và đóng sự cố?")) return
    setNotice(resolveIncident(incident.id, notes))
  }
  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink" to="/operator/incidents"><ArrowLeft className="size-4" /> Quay lại danh sách sự cố</Link>
      <OperatorPageHeader eyebrow={`${incident.id} • OP-13`} title="Chi tiết sự cố" description={incidentTypeLabels[incident.type]} action={<div className="flex gap-2"><SeverityBadge severity={incident.severity} /><IncidentStatusBadge status={incident.status} /></div>} />
      {notice ? <OperatorNotice tone={notice.ok ? "success" : "error"}>{notice.message}</OperatorNotice> : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_.75fr]">
        <Card>
          <CardHeader title="Thông tin sự cố" />
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <Detail label="Mô tả" value={incident.description} wide />
            <Detail
              label="Tài nguyên ảnh hưởng"
              value={`${incident.resourceId} • ${
                {
                  VEHICLE: "Phương tiện",
                  CHARGING_POINT: "Cổng sạc",
                  PARKING_SPACE: "Chỗ đỗ",
                  HUB: "Mobility Hub",
                }[incident.resourceKind]
              }`}
            />
            <Detail label="Mobility Hub" value={hub?.name ?? "Không xác định"} />
            <Detail label="Trạng thái kỹ thuật" value={resourceStatus ?? "Không xác định"} />
            <Detail label="Thời điểm phát hiện" value={formatDateTime(incident.detectedAt)} />
            <Detail label="Trạng thái xử lý" value={incidentStatusLabels[incident.status]} />
            {incident.resolutionNotes ? <Detail label="Ghi chú xử lý" value={incident.resolutionNotes} wide /> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Dòng thời gian" />
          <CardContent>
            <TimelineItem title="Phát hiện sự cố" description={formatDateTime(incident.detectedAt)} active />
            <TimelineItem title="Tiếp nhận xử lý" description={incident.status === "OPEN" ? "Chưa tiếp nhận" : "Đã chuyển đội kỹ thuật"} active={incident.status !== "OPEN"} />
            <TimelineItem title="Xác nhận khôi phục" description={incident.status === "RESOLVED" ? "Đã hoàn tất" : "Đang chờ"} active={incident.status === "RESOLVED"} last />
          </CardContent>
        </Card>
      </div>
      {incident.status !== "RESOLVED" ? (
        <Card>
          <CardHeader title="Thao tác xử lý" description="Tài nguyên chỉ được khôi phục sau khi sự cố đang xử lý và có ghi chú xác nhận." />
          <CardContent className="space-y-4">
            {incident.status === "OPEN" ? <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><OperatorNotice tone="warning">Tài nguyên đang bị loại khỏi các phân bổ mới.</OperatorNotice><Button onClick={start}>Bắt đầu xử lý</Button></div> : <><label className="grid gap-2 text-sm font-medium text-ink">Ghi chú xử lý<textarea className="min-h-28 rounded-xl border border-line p-3 text-sm outline-none focus:border-info focus:ring-4 focus:ring-info/10" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Mô tả kiểm tra, sửa chữa và kết quả xác nhận..." /></label><div className="flex justify-end"><Button disabled={notes.trim().length < 10} onClick={resolve}>Xác nhận xử lý và khôi phục</Button></div></>}
          </CardContent>
        </Card>
      ) : <OperatorNotice tone="success">Sự cố đã được xử lý. Tài nguyên chỉ được khôi phục nếu không còn sự cố đang mở khác.</OperatorNotice>}
    </div>
  )
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={wide ? "sm:col-span-2" : ""}><p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}</p><p className="mt-2 font-medium leading-6 text-ink">{value}</p></div>
}

function TimelineItem({ title, description, active, last = false }: { title: string; description: string; active: boolean; last?: boolean }) {
  return <div className="grid grid-cols-[1.5rem_1fr] gap-3"><div className="flex flex-col items-center"><span className={`mt-1 size-3 rounded-full ${active ? "bg-info" : "bg-slate-300"}`} />{!last ? <span className="min-h-16 w-px flex-1 bg-line" /> : null}</div><div className="pb-5"><p className={`text-sm font-semibold ${active ? "text-ink" : "text-ink-muted"}`}>{title}</p><p className="mt-1 text-xs text-ink-muted">{description}</p></div></div>
}
