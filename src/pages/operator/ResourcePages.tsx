import {
  BatteryCharging,
  Bike,
  CalendarClock,
  CircleParking,
  Clock3,
  PlugZap,
  TriangleAlert,
  Users,
  Zap,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router"
import {
  CapacityBar,
  DataTable,
  OperatorMetric,
  OperatorNotice,
  OperatorPageHeader,
  getHubMetrics,
} from "@/components/operator/OperatorUI"
import {
  SelectField,
  chargingStatusLabels,
  formatDateTime,
  parkingStatusLabels,
  reservationStatusLabels,
  requestStatusLabels,
  statusTone,
  technicalLabels,
  vehicleStatusLabels,
  vehicleTypeLabels,
} from "@/components/student/StudentUI"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { useAppStore } from "@/store/appStore"
import type { ChargingPointStatus, ParkingStatus } from "@/types/domain"

export function ParkingMonitoringPage() {
  const { data } = useAppStore()
  const [hubId, setHubId] = useState("ALL")
  const hubs = hubId === "ALL" ? data.hubs : data.hubs.filter((item) => item.id === hubId)
  const statusCount = (status: ParkingStatus) =>
    data.parkingSpaces.filter(
      (item) => item.status === status && (hubId === "ALL" || item.hubId === hubId),
    ).length
  return (
    <div className="space-y-6">
      <OperatorPageHeader
        eyebrow="OP-06"
        title="Giám sát chỗ đỗ"
        description="Theo dõi công suất, trạng thái phân bổ và các Hub gần ngưỡng đầy."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OperatorMetric icon={CircleParking} label="Còn trống" value={statusCount("AVAILABLE")} helper="Có thể phân bổ" />
        <OperatorMetric icon={CalendarClock} label="Đã đặt" value={statusCount("RESERVED")} helper="Reservation hợp lệ" tone="blue" />
        <OperatorMetric icon={Bike} label="Đang sử dụng" value={statusCount("OCCUPIED")} helper="Tài nguyên đang chiếm dụng" tone="amber" />
        <OperatorMetric icon={TriangleAlert} label="Không khả dụng" value={statusCount("UNAVAILABLE")} helper="Bị khóa bởi kỹ thuật" tone="red" />
      </div>
      <Card>
        <CardContent>
          <SelectField className="max-w-sm" label="Mobility Hub" value={hubId} onChange={(event) => setHubId(event.target.value)}>
            <option value="ALL">Toàn mạng lưới</option>
            {data.hubs.map((hub) => <option value={hub.id} key={hub.id}>{hub.name}</option>)}
          </SelectField>
        </CardContent>
      </Card>
      <Card>
        <CardHeader title="Công suất theo Mobility Hub" description="Hub trên 80% được đánh dấu cần theo dõi." />
        <CardContent className="grid gap-5 md:grid-cols-2">
          {hubs.map((hub) => {
            const metrics = getHubMetrics(data, hub.id)
            return (
              <Link className={`rounded-xl border p-4 transition hover:border-info/30 ${metrics.parkingUsage >= 80 ? "border-amber-300 bg-amber-50/40" : "border-line"}`} to={`/operator/hubs/${hub.id}`} key={hub.id}>
                <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-ink">{hub.name}</p><p className="mt-1 text-xs text-ink-muted">{metrics.availableParking}/{metrics.parking.length} chỗ còn trống</p></div>{metrics.parkingUsage >= 80 ? <Badge tone="warning">Gần đầy</Badge> : <Badge tone="success">Ổn định</Badge>}</div>
                <div className="mt-4"><CapacityBar value={metrics.parkingUsage} label="Mức sử dụng" /></div>
              </Link>
            )
          })}
        </CardContent>
      </Card>
      {hubs[0] ? (
        <Card>
          <CardHeader
            title={`Sơ đồ nhanh • ${hubs[0].name}`}
            description="Màu sắc đi kèm nhãn trạng thái để hỗ trợ khả năng tiếp cận."
          />
          <CardContent>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
              {data.parkingSpaces
                .filter((item) => item.hubId === hubs[0].id)
                .map((space) => (
                  <div
                    className={`rounded-xl border p-3 text-center ${
                      space.status === "AVAILABLE"
                        ? "border-brand/30 bg-brand-soft"
                        : space.status === "UNAVAILABLE"
                          ? "border-red-200 bg-red-50"
                          : "border-line bg-surface-muted"
                    }`}
                    key={space.id}
                  >
                    <CircleParking
                      className={`mx-auto size-5 ${
                        space.status === "AVAILABLE"
                          ? "text-brand"
                          : space.status === "UNAVAILABLE"
                            ? "text-danger"
                            : "text-ink-muted"
                      }`}
                    />
                    <p className="mt-2 text-xs font-semibold text-ink">{space.id}</p>
                    <p className="mt-1 text-[10px] text-ink-muted">
                      {parkingStatusLabels[space.status]}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader title="Chi tiết trạng thái chỗ đỗ" />
        <CardContent className="!p-0">
          <DataTable>
            <thead><tr className="border-b border-line text-xs uppercase tracking-wider text-ink-muted"><th className="px-4 py-3">Mã chỗ</th><th className="px-4 py-3">Mobility Hub</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Tương thích</th><th className="px-4 py-3">Lượt đặt</th></tr></thead>
            <tbody>{data.parkingSpaces.filter((item) => hubId === "ALL" || item.hubId === hubId).map((space) => <tr className="border-b border-line last:border-0" key={space.id}><td className="px-4 py-4 font-semibold text-ink">{space.id}</td><td className="px-4 py-4 text-sm text-ink-muted">{data.hubs.find((hub) => hub.id === space.hubId)?.name}</td><td className="px-4 py-4"><Badge tone={space.status === "AVAILABLE" ? "success" : space.status === "UNAVAILABLE" ? "danger" : "warning"}>{parkingStatusLabels[space.status]}</Badge></td><td className="px-4 py-4 text-sm text-ink-muted">{space.compatibleVehicleTypes.length} loại xe</td><td className="px-4 py-4 text-sm text-ink-muted">{space.currentReservationId ?? "—"}</td></tr>)}</tbody>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  )
}

export function ChargingPointMonitoringPage() {
  const { data } = useAppStore()
  const [hubId, setHubId] = useState("ALL")
  const [status, setStatus] = useState<ChargingPointStatus | "ALL">("ALL")
  const points = data.chargingPoints.filter(
    (item) =>
      (hubId === "ALL" || item.hubId === hubId) &&
      (status === "ALL" || item.status === status),
  )
  const count = (value: ChargingPointStatus) =>
    data.chargingPoints.filter((item) => item.status === value).length
  return (
    <div className="space-y-6">
      <OperatorPageHeader eyebrow="OP-07" title="Giám sát cổng sạc" description="Theo dõi phân bổ phiên sạc, trạng thái kỹ thuật và tài nguyên khả dụng." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OperatorMetric icon={PlugZap} label="Khả dụng" value={count("AVAILABLE")} helper="Sẵn sàng phân bổ" />
        <OperatorMetric icon={CalendarClock} label="Đã đặt" value={count("RESERVED")} helper="Đã có lịch" tone="blue" />
        <OperatorMetric icon={Zap} label="Đang sạc" value={count("CHARGING")} helper="Phiên đang hoạt động" tone="amber" />
        <OperatorMetric icon={TriangleAlert} label="Không khả dụng" value={count("UNAVAILABLE")} helper="Cần xử lý kỹ thuật" tone="red" />
      </div>
      <Card><CardContent className="grid gap-4 md:grid-cols-2"><SelectField label="Mobility Hub" value={hubId} onChange={(event) => setHubId(event.target.value)}><option value="ALL">Tất cả Hub</option>{data.hubs.map((hub) => <option value={hub.id} key={hub.id}>{hub.name}</option>)}</SelectField><SelectField label="Trạng thái" value={status} onChange={(event) => setStatus(event.target.value as ChargingPointStatus | "ALL")}><option value="ALL">Tất cả trạng thái</option>{Object.entries(chargingStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</SelectField></CardContent></Card>
      <Card>
        <CardHeader title="Danh sách cổng sạc" description={`${points.length} tài nguyên phù hợp`} />
        <CardContent className="!p-0">
          <DataTable>
            <thead><tr className="border-b border-line text-xs uppercase tracking-wider text-ink-muted"><th className="px-4 py-3">Mã cổng</th><th className="px-4 py-3">Mobility Hub</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Phiên sạc</th><th className="px-4 py-3">Kỹ thuật</th></tr></thead>
            <tbody>{points.map((point) => <tr className="border-b border-line last:border-0" key={point.id}><td className="px-4 py-4 font-semibold text-ink">{point.id}</td><td className="px-4 py-4 text-sm text-ink-muted">{data.hubs.find((hub) => hub.id === point.hubId)?.name}</td><td className="px-4 py-4"><Badge tone={point.status === "AVAILABLE" ? "success" : point.status === "UNAVAILABLE" ? "danger" : "warning"}>{chargingStatusLabels[point.status]}</Badge></td><td className="px-4 py-4 text-sm text-ink-muted">{point.assignedSessionId ?? "—"}</td><td className="px-4 py-4 text-sm font-medium text-ink">{technicalLabels[point.technicalCondition]}</td></tr>)}</tbody>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  )
}

export function ChargingSchedulePage() {
  const { data, assignChargingRequest } = useAppStore()
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null)
  const requests = useMemo(
    () =>
      [...data.chargingRequests].sort((a, b) => {
        const upcomingA = data.vehicleReservations.some(
          (item) =>
            item.resourceId === a.vehicleId && item.status === "CONFIRMED",
        )
        const upcomingB = data.vehicleReservations.some(
          (item) =>
            item.resourceId === b.vehicleId && item.status === "CONFIRMED",
        )
        const batteryA = data.vehicles.find((item) => item.id === a.vehicleId)?.batteryLevel ?? 100
        const batteryB = data.vehicles.find((item) => item.id === b.vehicleId)?.batteryLevel ?? 100
        return (
          Number(upcomingB) -
            Number(upcomingA) ||
          batteryA - batteryB ||
          a.requestedTime.start.localeCompare(b.requestedTime.start)
        )
      }),
    [data.chargingRequests, data.vehicles],
  )
  const pending = requests.filter((item) => item.status === "PENDING" || item.status === "ACCEPTED")
  const scheduled = requests.filter((item) => item.status === "SCHEDULED" || item.status === "CHARGING")
  const assign = (requestId: string, pointId: string) => {
    if (!window.confirm(`Xác nhận phân bổ yêu cầu ${requestId} vào ${pointId}?`)) return
    setNotice(assignChargingRequest(requestId, pointId))
  }
  return (
    <div className="space-y-6">
      <OperatorPageHeader eyebrow="OP-08" title="Quản lý lịch sạc" description="Ưu tiên minh bạch theo mức pin thấp, nhu cầu sử dụng và khả năng tài nguyên." />
      {notice ? <OperatorNotice tone={notice.ok ? "success" : "error"}>{notice.message}</OperatorNotice> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OperatorMetric icon={Users} label="Yêu cầu chờ" value={pending.length} helper="Chưa có cổng phù hợp" tone="amber" />
        <OperatorMetric icon={CalendarClock} label="Đã xếp lịch" value={requests.filter((item) => item.status === "SCHEDULED").length} helper="Sắp diễn ra" tone="blue" />
        <OperatorMetric icon={Zap} label="Đang sạc" value={requests.filter((item) => item.status === "CHARGING").length} helper="Phiên hoạt động" />
        <OperatorMetric icon={TriangleAlert} label="Xung đột" value={pending.filter((request) => !data.chargingPoints.some((point) => point.hubId === request.hubId && point.status === "AVAILABLE")).length} helper="Thiếu tài nguyên tại Hub" tone="red" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
        <Card>
          <CardHeader title="Hàng đợi ưu tiên" description="Pin thấp được xếp trước trong cùng nhóm thời gian." />
          <CardContent className="space-y-3">
            {pending.length ? pending.map((request, index) => {
              const vehicle = data.vehicles.find((item) => item.id === request.vehicleId)
              const hasUpcomingUsage = data.vehicleReservations.some(
                (item) =>
                  item.resourceId === request.vehicleId &&
                  item.status === "CONFIRMED",
              )
              const available = data.chargingPoints.filter((point) => point.hubId === request.hubId && point.status === "AVAILABLE" && (!vehicle || point.compatibleVehicleTypes.includes(vehicle.type)))
              return <div className="rounded-xl border border-line p-4" key={request.id}><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-sm font-bold text-amber-700">{index + 1}</span><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-ink">{request.id} • {request.vehicleId}</p><Badge tone="warning">Chờ xếp lịch</Badge>{hasUpcomingUsage ? <Badge tone="info">Có lịch sử dụng sắp tới</Badge> : null}</div><p className="mt-1 text-sm text-ink-muted">Pin {vehicle?.batteryLevel ?? "—"}% • {data.hubs.find((hub) => hub.id === request.hubId)?.name}</p><p className="mt-1 text-xs text-ink-muted">Lý do ưu tiên: {hasUpcomingUsage ? "Có lượt đặt xe sắp tới" : vehicle && vehicle.batteryLevel < 50 ? "Mức pin thấp" : "Theo thời gian yêu cầu"}</p></div></div>{available[0] ? <Button onClick={() => assign(request.id, available[0].id)}>Xếp vào {available[0].id}</Button> : <Badge tone="danger">Không có cổng trống</Badge>}</div></div>
            }) : <p className="py-8 text-center text-sm text-ink-muted">Không có yêu cầu đang chờ.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Dòng thời gian sạc" description="Các phiên đã được phân bổ." />
          <CardContent className="space-y-0">
            {scheduled.map((request, index) => <div className="grid grid-cols-[4rem_1.5rem_1fr] gap-3" key={request.id}><p className="pt-1 text-right text-xs font-semibold text-ink-muted">{new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(request.assignedTime?.start ?? request.requestedTime.start))}</p><div className="flex flex-col items-center"><span className={`mt-1 size-3 rounded-full ${request.status === "CHARGING" ? "bg-warning" : "bg-info"}`} />{index < scheduled.length - 1 ? <span className="min-h-20 w-px flex-1 bg-line" /> : null}</div><div className="pb-6"><p className="font-semibold text-ink">{request.resourceId} • {request.vehicleId}</p><p className="mt-1 text-sm text-ink-muted">{request.id}</p><Badge tone={statusTone(request.status)}>{requestStatusLabels[request.status]}</Badge></div></div>)}
          </CardContent>
        </Card>
      </div>
      <OperatorNotice tone="info">Điều chỉnh lịch chỉ hỗ trợ phân bổ yêu cầu đang chờ vào cổng khả dụng cùng Hub. Mọi thay đổi đều được xác nhận và kiểm tra lại trạng thái.</OperatorNotice>
    </div>
  )
}

export function ResourceAllocationPage() {
  const { data } = useAppStore()
  const [tab, setTab] = useState<"OVERVIEW" | "VEHICLES" | "PARKING" | "CHARGING" | "EVENTS">("OVERVIEW")
  const activeVehicleReservations = data.vehicleReservations.filter((item) => item.status === "CONFIRMED" || item.status === "ACTIVE")
  const activeParking = data.parkingReservations.filter((item) => item.status === "CONFIRMED")
  const activeCharging = data.chargingRequests.filter((item) => ["PENDING", "SCHEDULED", "CHARGING"].includes(item.status))
  const conflicts = data.vehicles.filter((vehicle) => vehicle.technicalCondition === "MAJOR_DAMAGE" && vehicle.usageStatus !== "AVAILABLE").length
  return (
    <div className="space-y-6">
      <OperatorPageHeader eyebrow="OP-11" title="Phân bổ tài nguyên" description="Giao diện giám sát chỉ đọc cho phân bổ, lượt đặt và sự kiện gần đây." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OperatorMetric icon={Bike} label="Đặt xe hoạt động" value={activeVehicleReservations.length} helper="Đã xác nhận hoặc đang dùng" />
        <OperatorMetric icon={CircleParking} label="Phân bổ chỗ đỗ" value={activeParking.length} helper="Reservation còn hiệu lực" tone="blue" />
        <OperatorMetric icon={BatteryCharging} label="Phân bổ sạc" value={activeCharging.length} helper="Chờ, đã xếp hoặc đang sạc" tone="amber" />
        <OperatorMetric icon={TriangleAlert} label="Xung đột tài nguyên" value={conflicts} helper="Cần kiểm tra điều kiện" tone="red" />
      </div>
      <div className="flex gap-2 overflow-x-auto border-b border-line pb-2">
        {[["OVERVIEW", "Theo Hub"], ["VEHICLES", "Đặt xe"], ["PARKING", "Chỗ đỗ"], ["CHARGING", "Lịch sạc"], ["EVENTS", "Sự kiện"]].map(([value, label]) => <button key={value} aria-pressed={tab === value} onClick={() => setTab(value as typeof tab)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${tab === value ? "bg-blue-50 text-info" : "text-ink-muted"}`}>{label}</button>)}
      </div>
      <Card>
        <CardContent>
          {tab === "OVERVIEW" ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.hubs.map((hub) => { const metrics = getHubMetrics(data, hub.id); return <div className="rounded-xl border border-line p-4" key={hub.id}><div className="flex items-center justify-between"><p className="font-semibold text-ink">{hub.name}</p><Badge tone={metrics.parkingUsage > 80 ? "warning" : "success"}>{metrics.parkingUsage}% đỗ</Badge></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><Small label="Xe trống" value={metrics.availableVehicles} /><Small label="Chỗ đỗ" value={metrics.availableParking} /><Small label="Cổng sạc" value={metrics.availableCharging} /></div></div>})}</div> : null}
          {tab === "VEHICLES" ? <AllocationRows rows={activeVehicleReservations.map((item) => [item.id, item.resourceId, reservationStatusLabels[item.status], item.pickupHubId])} headers={["Mã đặt xe", "Phương tiện", "Trạng thái", "Hub nhận"]} /> : null}
          {tab === "PARKING" ? <AllocationRows rows={activeParking.map((item) => [item.id, item.resourceId, item.vehicleId, item.hubId])} headers={["Mã đặt chỗ", "Chỗ đỗ", "Phương tiện", "Hub"]} /> : null}
          {tab === "CHARGING" ? <AllocationRows rows={activeCharging.map((item) => [item.id, item.resourceId ?? "Chưa phân bổ", item.vehicleId, requestStatusLabels[item.status]])} headers={["Yêu cầu", "Cổng sạc", "Phương tiện", "Trạng thái"]} /> : null}
          {tab === "EVENTS" ? <div className="space-y-3">{[...data.dispatchOperations.map((item) => ({ id: item.id, text: `Điều phối ${item.vehicleIds.length} xe từ ${item.sourceHubId} đến ${item.destinationHubId}`, time: item.createdAt })), ...data.incidents.slice(0, 5).map((item) => ({ id: item.id, text: `${item.id}: ${item.description}`, time: item.detectedAt }))].map((event) => <div className="flex items-start gap-3 rounded-xl border border-line p-4" key={event.id}><span className="mt-1.5 size-2 rounded-full bg-info" /><div><p className="text-sm font-medium text-ink">{event.text}</p><p className="mt-1 text-xs text-ink-muted">{formatDateTime(event.time)}</p></div></div>)}</div> : null}
        </CardContent>
      </Card>
    </div>
  )
}

function Small({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-surface-muted p-2"><p className="font-bold text-ink">{value}</p><p className="text-[10px] text-ink-muted">{label}</p></div>
}

function AllocationRows({ rows, headers }: { rows: string[][]; headers: string[] }) {
  return <DataTable><thead><tr className="border-b border-line text-xs uppercase tracking-wider text-ink-muted">{headers.map((header) => <th className="px-4 py-3" key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr className="border-b border-line last:border-0" key={row[0]}>{row.map((cell, index) => <td className={`px-4 py-4 text-sm ${index === 0 ? "font-semibold text-ink" : "text-ink-muted"}`} key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></DataTable>
}
