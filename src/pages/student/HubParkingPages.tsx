import {
  ArrowLeft,
  BatteryCharging,
  Bike,
  Building2,
  CalendarClock,
  CarFront,
  CheckCircle2,
  CircleParking,
  Grid3X3,
  List,
  Map,
  MapPin,
  Search,
  XCircle,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Link, useParams } from "react-router"
import {
  EmptyState,
  Notice,
  PageHeader,
  SelectField,
  formatDateTime,
  futureLocalDateTime,
  hubStatusLabels,
  parkingStatusLabels,
  reservationStatusLabels,
  statusTone,
  vehicleTypeLabels,
} from "@/components/student/StudentUI"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { TextInput } from "@/components/ui/TextInput"
import { useAppStore } from "@/store/appStore"
import type { ParkingStatus, VehicleType } from "@/types/domain"

export function HubExplorerPage() {
  const { data } = useAppStore()
  const [query, setQuery] = useState("")
  const [requirement, setRequirement] = useState("ALL")
  const [view, setView] = useState<"LIST" | "MAP">("LIST")

  const hubs = useMemo(
    () =>
      data.hubs.filter((hub) => {
        const searchMatch = `${hub.name} ${hub.location}`
          .toLowerCase()
          .includes(query.toLowerCase())
        const vehicles = data.vehicles.filter(
          (item) =>
            item.currentHubId === hub.id && item.usageStatus === "AVAILABLE",
        ).length
        const parking = data.parkingSpaces.filter(
          (item) => item.hubId === hub.id && item.status === "AVAILABLE",
        ).length
        const charging = data.chargingPoints.filter(
          (item) => item.hubId === hub.id && item.status === "AVAILABLE",
        ).length
        const resourceMatch =
          requirement === "ALL" ||
          (requirement === "PICKUP" && vehicles > 0) ||
          (requirement === "RETURN" && parking > 0) ||
          (requirement === "PARKING" && parking > 0) ||
          (requirement === "CHARGING" && charging > 0)
        return searchMatch && resourceMatch
      }),
    [
      data.chargingPoints,
      data.hubs,
      data.parkingSpaces,
      data.vehicles,
      query,
      requirement,
    ],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ST-08"
        title="Tìm Mobility Hub"
        description="Khám phá tài nguyên phương tiện, chỗ đỗ và cổng sạc tại các Hub trong khu đô thị."
      />
      <Card>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_14rem_auto]">
          <TextInput
            label="Tìm theo tên hoặc vị trí"
            placeholder="Ký túc xá, Bách khoa..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <SelectField
            label="Nhu cầu"
            value={requirement}
            onChange={(event) => setRequirement(event.target.value)}
          >
            <option value="ALL">Tất cả tài nguyên</option>
            <option value="PICKUP">Nhận phương tiện</option>
            <option value="RETURN">Trả phương tiện</option>
            <option value="PARKING">Chỗ đỗ</option>
            <option value="CHARGING">Cổng sạc</option>
          </SelectField>
          <div className="flex min-h-12 items-center gap-1 self-end rounded-xl bg-surface-muted p-1">
            <button
              className={`grid size-10 place-items-center rounded-lg ${view === "LIST" ? "bg-white text-brand shadow-sm" : "text-ink-muted"}`}
              onClick={() => setView("LIST")}
              aria-label="Xem danh sách"
              aria-pressed={view === "LIST"}
            ><List className="size-4" /></button>
            <button
              className={`grid size-10 place-items-center rounded-lg ${view === "MAP" ? "bg-white text-brand shadow-sm" : "text-ink-muted"}`}
              onClick={() => setView("MAP")}
              aria-label="Xem bản đồ"
              aria-pressed={view === "MAP"}
            ><Map className="size-4" /></button>
          </div>
        </CardContent>
      </Card>

      {view === "LIST" ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {hubs.map((hub, index) => {
            const vehicleCount = data.vehicles.filter(
              (item) =>
                item.currentHubId === hub.id &&
                item.usageStatus === "AVAILABLE",
            ).length
            const parkingCount = data.parkingSpaces.filter(
              (item) => item.hubId === hub.id && item.status === "AVAILABLE",
            ).length
            const chargingCount = data.chargingPoints.filter(
              (item) => item.hubId === hub.id && item.status === "AVAILABLE",
            ).length
            return (
              <Card className="overflow-hidden" key={hub.id}>
                <div className="relative h-32 bg-gradient-to-br from-brand-soft to-blue-50">
                  <MapPin className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 text-brand" />
                  <span className="absolute right-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">
                    {(1.2 + index * 0.8).toFixed(1)} km
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-ink">{hub.name}</h2>
                      <p className="mt-1 text-sm text-ink-muted">{hub.location}</p>
                    </div>
                    <Badge
                      tone={
                        hub.operationalStatus === "OPERATIONAL"
                          ? "success"
                          : "warning"
                      }
                    >
                      {hubStatusLabels[hub.operationalStatus]}
                    </Badge>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <ResourceCount icon={Bike} value={vehicleCount} label="Xe" />
                    <ResourceCount
                      icon={CircleParking}
                      value={parkingCount}
                      label="Chỗ đỗ"
                    />
                    <ResourceCount
                      icon={BatteryCharging}
                      value={chargingCount}
                      label="Cổng sạc"
                    />
                  </div>
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-xs text-ink-muted">
                      <span>Mức sử dụng</span><strong>{Math.min(hub.utilization, 96)}%</strong>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${hub.utilization > 80 ? "bg-warning" : "bg-brand"}`}
                        style={{ width: `${Math.min(hub.utilization, 96)}%` }}
                      />
                    </div>
                  </div>
                  <Link
                    className="button-secondary mt-5 w-full"
                    to={`/student/hubs/${hub.id}`}
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="relative min-h-[34rem] overflow-hidden bg-slate-100">
          <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:22px_22px]" />
          {hubs.map((hub, index) => (
            <Link
              key={hub.id}
              to={`/student/hubs/${hub.id}`}
              className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl bg-white p-3 shadow-lg"
              style={{
                left: `${18 + (index % 3) * 32}%`,
                top: `${25 + Math.floor(index / 3) * 48}%`,
              }}
            >
              <span className="grid size-9 place-items-center rounded-lg bg-brand text-white"><MapPin className="size-4" /></span>
              <span className="max-w-36 text-xs font-semibold text-ink">{hub.name.replace("Mobility Hub ", "")}</span>
            </Link>
          ))}
        </Card>
      )}
    </div>
  )
}

function ResourceCount({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Bike
  value: number
  label: string
}) {
  return (
    <div className="rounded-xl bg-surface-muted p-2 text-center">
      <Icon className="mx-auto size-4 text-brand" />
      <p className="mt-1 text-sm font-bold text-ink">{value}</p>
      <p className="text-[11px] text-ink-muted">{label}</p>
    </div>
  )
}

export function HubDetailsPage() {
  const { id } = useParams()
  const { data } = useAppStore()
  const [tab, setTab] = useState<"OVERVIEW" | "VEHICLES" | "PARKING" | "CHARGING">("OVERVIEW")
  const hub = data.hubs.find((item) => item.id === id)
  if (!hub) {
    return <EmptyState icon={Building2} title="Không tìm thấy Mobility Hub" description="Hub không tồn tại trong dữ liệu mô phỏng." />
  }
  const vehicles = data.vehicles.filter((item) => item.currentHubId === hub.id)
  const parking = data.parkingSpaces.filter((item) => item.hubId === hub.id)
  const charging = data.chargingPoints.filter((item) => item.hubId === hub.id)
  const availableVehicles = vehicles.filter((item) => item.usageStatus === "AVAILABLE").length
  const availableParking = parking.filter((item) => item.status === "AVAILABLE").length
  const availableCharging = charging.filter((item) => item.status === "AVAILABLE").length

  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink" to="/student/hubs"><ArrowLeft className="size-4" /> Quay lại danh sách Hub</Link>
      <PageHeader
        eyebrow={`${hub.id} • ST-09`}
        title={hub.name}
        description={`${hub.location} • Dữ liệu hạ tầng mô phỏng`}
        action={<Badge tone={hub.operationalStatus === "OPERATIONAL" ? "success" : "warning"}>{hubStatusLabels[hub.operationalStatus]}</Badge>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Summary title="Mức sử dụng" value={`${Math.min(hub.utilization, 96)}%`} icon={Building2} />
        <Summary title="Phương tiện khả dụng" value={`${availableVehicles}/${vehicles.length}`} icon={Bike} />
        <Summary title="Chỗ đỗ còn trống" value={`${availableParking}/${parking.length}`} icon={CircleParking} />
        <Summary title="Cổng sạc khả dụng" value={`${availableCharging}/${charging.length}`} icon={BatteryCharging} />
      </div>
      <div className="flex gap-2 overflow-x-auto border-b border-line pb-2">
        {[
          ["OVERVIEW", "Tổng quan"],
          ["VEHICLES", "Phương tiện"],
          ["PARKING", "Chỗ đỗ"],
          ["CHARGING", "Cổng sạc"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value as typeof tab)}
            aria-pressed={tab === value}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${tab === value ? "bg-brand-soft text-brand-strong" : "text-ink-muted hover:bg-surface-muted"}`}
          >{label}</button>
        ))}
      </div>
      <Card>
        <CardContent>
          {tab === "OVERVIEW" ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div><h2 className="font-semibold text-ink">Thông tin Hub</h2><dl className="mt-4 space-y-4"><Row label="Mã Hub" value={hub.id} /><Row label="Địa điểm" value={hub.location} /><Row label="Tổng sức chứa đỗ" value={`${hub.totalParkingCapacity} chỗ`} /><Row label="Cập nhật cuối" value="08:30 • 18/03/2026" /></dl></div>
              <div className="rounded-2xl bg-surface-muted p-5"><h2 className="font-semibold text-ink">Tình trạng công suất</h2><div className="mt-5 h-3 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(hub.utilization, 96)}%` }} /></div><p className="mt-3 text-sm leading-6 text-ink-muted">Công suất được tính từ các bản ghi tài nguyên hiện có trong mô phỏng.</p></div>
            </div>
          ) : null}
          {tab === "VEHICLES" ? (
            <div className="grid gap-3 md:grid-cols-2">
              {vehicles.map((vehicle) => <Link className="flex items-center justify-between rounded-xl border border-line p-4 hover:border-brand/30" to={`/student/vehicles/${vehicle.id}`} key={vehicle.id}><div><p className="font-semibold text-ink">{vehicle.id}</p><p className="text-sm text-ink-muted">{vehicleTypeLabels[vehicle.type]} • Pin {vehicle.batteryLevel}%</p></div><Badge tone={vehicle.usageStatus === "AVAILABLE" ? "success" : "warning"}>{vehicle.usageStatus === "AVAILABLE" ? "Khả dụng" : "Đang bận"}</Badge></Link>)}
            </div>
          ) : null}
          {tab === "PARKING" ? <ResourceGrid items={parking.map((item) => ({ id: item.id, status: item.status, label: parkingStatusLabels[item.status] }))} /> : null}
          {tab === "CHARGING" ? <ResourceGrid items={charging.map((item) => ({ id: item.id, status: item.status, label: item.status === "AVAILABLE" ? "Khả dụng" : item.status === "CHARGING" ? "Đang sạc" : item.status === "RESERVED" ? "Đã đặt" : "Không khả dụng" }))} /> : null}
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-3">
        <Link className="button-secondary" to={`/student/vehicles?hub=${hub.id}`}>Xem phương tiện</Link>
        <Link className="button-secondary" to={`/student/parking/reserve?hub=${hub.id}`}>Đặt chỗ đỗ</Link>
        <Link className="button-primary" to={`/student/charging/register?hub=${hub.id}`}>Đăng ký sạc</Link>
      </div>
    </div>
  )
}

function Summary({ title, value, icon: Icon }: { title: string; value: string; icon: typeof Bike }) {
  return <Card className="flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand"><Icon className="size-5" /></span><div><p className="text-sm text-ink-muted">{title}</p><p className="mt-1 text-2xl font-bold text-ink">{value}</p></div></Card>
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-line pb-3 text-sm"><dt className="text-ink-muted">{label}</dt><dd className="text-right font-medium text-ink">{value}</dd></div>
}

function ResourceGrid({ items }: { items: { id: string; status: string; label: string }[] }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{items.map((item) => <div className={`rounded-xl border p-4 text-center ${item.status === "AVAILABLE" ? "border-brand/30 bg-brand-soft/40" : item.status === "UNAVAILABLE" ? "border-red-200 bg-red-50" : "border-line bg-surface-muted"}`} key={item.id}><Grid3X3 className={`mx-auto size-5 ${item.status === "AVAILABLE" ? "text-brand" : "text-ink-muted"}`} /><p className="mt-2 text-sm font-semibold text-ink">{item.id}</p><p className="mt-1 text-xs text-ink-muted">{item.label}</p></div>)}</div>
}

export function ParkingAvailabilityPage() {
  const { data } = useAppStore()
  const [hubId, setHubId] = useState(data.hubs[0]?.id ?? "")
  const spaces = data.parkingSpaces.filter((item) => item.hubId === hubId)
  const counts = (status: ParkingStatus) => spaces.filter((item) => item.status === status).length
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="ST-10" title="Tình trạng chỗ đỗ" description="Theo dõi công suất và trạng thái từng vị trí đỗ tại Mobility Hub." action={<Link className="button-primary" to={`/student/parking/reserve?hub=${hubId}`}>Đặt chỗ đỗ</Link>} />
      <Card><CardContent><SelectField className="max-w-md" label="Mobility Hub" value={hubId} onChange={(event) => setHubId(event.target.value)}>{data.hubs.map((hub) => <option value={hub.id} key={hub.id}>{hub.name}</option>)}</SelectField></CardContent></Card>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[["AVAILABLE", "Còn trống", "text-brand"], ["RESERVED", "Đã đặt", "text-info"], ["OCCUPIED", "Đang sử dụng", "text-warning"], ["UNAVAILABLE", "Không khả dụng", "text-danger"]].map(([status, label, color]) => <Card className="p-4" key={status}><p className={`text-2xl font-bold ${color}`}>{counts(status as ParkingStatus)}</p><p className="mt-1 text-sm text-ink-muted">{label}</p></Card>)}
      </div>
      <Card>
        <CardHeader title="Sơ đồ chỗ đỗ" description={`${counts("AVAILABLE")} trong ${spaces.length} chỗ đang sẵn sàng`} />
        <CardContent><ResourceGrid items={spaces.map((item) => ({ id: item.id, status: item.status, label: parkingStatusLabels[item.status] }))} /></CardContent>
      </Card>
      <div className="flex flex-wrap gap-4 text-sm text-ink-muted">
        {(["AVAILABLE", "RESERVED", "OCCUPIED", "UNAVAILABLE"] as ParkingStatus[]).map((status) => <span className="flex items-center gap-2" key={status}><span className={`size-3 rounded-sm ${status === "AVAILABLE" ? "bg-brand" : status === "RESERVED" ? "bg-info" : status === "OCCUPIED" ? "bg-warning" : "bg-danger"}`} />{parkingStatusLabels[status]}</span>)}
      </div>
    </div>
  )
}

export function ParkingReservationPage() {
  const { data, reserveParking } = useAppStore()
  const params = new URLSearchParams(window.location.search)
  const [hubId, setHubId] = useState(params.get("hub") ?? data.hubs[0]?.id ?? "")
  const [mode, setMode] = useState<"SHARED" | "PRIVATE">("SHARED")
  const [sharedVehicleId, setSharedVehicleId] = useState(data.vehicles[0]?.id ?? "")
  const [privateVehicleId, setPrivateVehicleId] = useState("")
  const [privateType, setPrivateType] = useState<VehicleType>("ELECTRIC_MOTORCYCLE")
  const [start, setStart] = useState(futureLocalDateTime(2))
  const [end, setEnd] = useState(futureLocalDateTime(4))
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null)
  const vehicle = data.vehicles.find((item) => item.id === sharedVehicleId)
  const type = mode === "SHARED" ? vehicle?.type ?? "ELECTRIC_BICYCLE" : privateType
  const vehicleId = mode === "SHARED" ? sharedVehicleId : privateVehicleId
  const compatibleSpaces = data.parkingSpaces.filter((item) => item.hubId === hubId && item.status === "AVAILABLE" && item.compatibleVehicleTypes.includes(type))
  const submit = () => {
    setNotice(reserveParking({ hubId, vehicleId, vehicleType: type, requestedTime: { start, end } }))
  }
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="ST-11" title="Đặt chỗ đỗ xe" description="Chọn loại phương tiện, Mobility Hub và khoảng thời gian cần giữ chỗ." />
      {notice ? <Notice tone={notice.ok ? "success" : "error"}>{notice.message}</Notice> : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_.65fr]">
        <Card>
          <CardHeader title="Thông tin đặt chỗ" />
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-muted p-1">
              <button aria-pressed={mode === "SHARED"} className={`h-11 rounded-lg text-sm font-semibold ${mode === "SHARED" ? "bg-white text-ink shadow-sm" : "text-ink-muted"}`} onClick={() => setMode("SHARED")}>Xe dùng chung</button>
              <button aria-pressed={mode === "PRIVATE"} className={`h-11 rounded-lg text-sm font-semibold ${mode === "PRIVATE" ? "bg-white text-ink shadow-sm" : "text-ink-muted"}`} onClick={() => setMode("PRIVATE")}>Xe cá nhân</button>
            </div>
            <SelectField label="Mobility Hub" value={hubId} onChange={(event) => setHubId(event.target.value)}>{data.hubs.map((hub) => <option value={hub.id} key={hub.id}>{hub.name}</option>)}</SelectField>
            {mode === "SHARED" ? (
              <SelectField label="Phương tiện" value={sharedVehicleId} onChange={(event) => setSharedVehicleId(event.target.value)}>{data.vehicles.map((item) => <option value={item.id} key={item.id}>{item.id} • {vehicleTypeLabels[item.type]}</option>)}</SelectField>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2"><TextInput label="Biển số hoặc mã xe" value={privateVehicleId} onChange={(event) => setPrivateVehicleId(event.target.value)} placeholder="59-X1-12345" /><SelectField label="Loại phương tiện" value={privateType} onChange={(event) => setPrivateType(event.target.value as VehicleType)}>{Object.entries(vehicleTypeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</SelectField></div>
            )}
            <div className="grid gap-4 sm:grid-cols-2"><TextInput label="Thời gian bắt đầu" type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} /><TextInput label="Thời gian kết thúc" type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Khả dụng tài nguyên" />
          <CardContent className="space-y-5">
            <span className={`mx-auto grid size-20 place-items-center rounded-3xl ${compatibleSpaces.length ? "bg-brand-soft text-brand" : "bg-red-50 text-danger"}`}><CircleParking className="size-10" /></span>
            <div className="text-center"><p className="text-3xl font-bold text-ink">{compatibleSpaces.length}</p><p className="mt-1 text-sm text-ink-muted">chỗ đỗ tương thích đang trống</p></div>
            {compatibleSpaces.length ? <Notice tone="success">Có thể phân bổ chỗ đỗ cho lựa chọn hiện tại.</Notice> : <Notice tone="error">Không còn chỗ đỗ phù hợp tại Hub này.</Notice>}
            <Button className="w-full" disabled={!compatibleSpaces.length || !vehicleId || !start || !end} onClick={submit}>Xác nhận đặt chỗ</Button>
            {notice?.ok ? <Link className="button-secondary w-full" to="/student/parking/my-reservations">Xem chỗ đỗ đã đặt</Link> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function MyParkingReservationsPage() {
  const { data, currentUser, cancelParkingReservation } = useAppStore()
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null)
  const reservations = data.parkingReservations
    .filter((item) => item.userId === currentUser?.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const cancel = (id: string) => {
    if (!window.confirm("Bạn có chắc muốn hủy chỗ đỗ này?")) return
    setNotice(cancelParkingReservation(id))
  }
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="ST-12" title="Chỗ đỗ đã đặt" description="Theo dõi và hủy các lượt đặt chỗ còn hiệu lực." action={<Link className="button-primary" to="/student/parking/reserve">Đặt chỗ mới</Link>} />
      {notice ? <Notice tone={notice.ok ? "success" : "error"}>{notice.message}</Notice> : null}
      {reservations.length ? (
        <div className="space-y-4">
          {reservations.map((reservation) => {
            const hub = data.hubs.find((item) => item.id === reservation.hubId)
            return (
              <Card key={reservation.id}>
                <CardContent className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                  <div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><CircleParking className="size-6" /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-ink">{reservation.id}</h2><Badge tone={statusTone(reservation.status)}>{reservationStatusLabels[reservation.status]}</Badge></div><p className="mt-2 text-sm font-medium text-ink">{hub?.name}</p><p className="mt-1 text-sm text-ink-muted">{reservation.vehicleId} • {reservation.resourceId}</p><p className="mt-2 flex items-center gap-2 text-xs text-ink-muted"><CalendarClock className="size-4" /> {formatDateTime(reservation.requestedTime.start)} – {formatDateTime(reservation.requestedTime.end)}</p></div></div>
                  <div className="flex gap-2"><Link className="button-secondary" to={`/student/hubs/${reservation.hubId}`}>Xem Hub</Link>{reservation.status === "CONFIRMED" ? <Button variant="danger" onClick={() => cancel(reservation.id)}>Hủy đặt chỗ</Button> : null}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={CircleParking} title="Chưa có chỗ đỗ đã đặt" description="Đặt trước một chỗ đỗ để đảm bảo tài nguyên cho hành trình." action={<Link className="button-primary" to="/student/parking/reserve">Đặt chỗ đỗ</Link>} />
      )}
    </div>
  )
}
