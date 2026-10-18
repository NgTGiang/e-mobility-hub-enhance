import {
  BatteryCharging,
  CalendarDays,
  CalendarClock,
  CarFront,
  CheckCircle2,
  Clock3,
  PlugZap,
  Zap,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router"
import {
  EmptyState,
  Notice,
  PageHeader,
  SelectField,
  chargingStatusLabels,
  formatDateTime,
  futureLocalDateTime,
  requestStatusLabels,
  statusTone,
  vehicleTypeLabels,
} from "@/components/student/StudentUI"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { TextInput } from "@/components/ui/TextInput"
import { useAppStore } from "@/store/appStore"
import type { ChargingPointStatus, VehicleType } from "@/types/domain"

export function ChargingAvailabilityPage() {
  const { data } = useAppStore()
  const [hubId, setHubId] = useState(data.hubs[0]?.id ?? "")
  const points = data.chargingPoints.filter((item) => item.hubId === hubId)
  const counts = (status: ChargingPointStatus) =>
    points.filter((item) => item.status === status).length
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ST-13"
        title="Trạng thái trạm sạc"
        description="Kiểm tra trạng thái và khả năng phục vụ của từng cổng sạc."
        action={
          <Link
            className="button-primary"
            to={`/student/charging/register?hub=${hubId}`}
          >
            Đăng ký lịch sạc
          </Link>
        }
      />
      <Card>
        <CardContent>
          <SelectField
            className="max-w-md"
            label="Mobility Hub"
            value={hubId}
            onChange={(event) => setHubId(event.target.value)}
          >
            {data.hubs.map((hub) => (
              <option value={hub.id} key={hub.id}>{hub.name}</option>
            ))}
          </SelectField>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["AVAILABLE", "Khả dụng", "text-brand"],
          ["RESERVED", "Đã đặt", "text-info"],
          ["CHARGING", "Đang sạc", "text-warning"],
          ["UNAVAILABLE", "Không khả dụng", "text-danger"],
        ].map(([status, label, color]) => (
          <Card className="p-4" key={status}>
            <p className={`text-2xl font-bold ${color}`}>
              {counts(status as ChargingPointStatus)}
            </p>
            <p className="mt-1 text-sm text-ink-muted">{label}</p>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader
          title="Danh sách cổng sạc"
          description={`${counts("AVAILABLE")} trong ${points.length} cổng đang khả dụng`}
        />
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {points.map((point) => (
              <div
                className={`rounded-2xl border p-5 ${
                  point.status === "AVAILABLE"
                    ? "border-brand/30 bg-brand-soft/30"
                    : point.status === "UNAVAILABLE"
                      ? "border-red-200 bg-red-50"
                      : "border-line bg-surface-muted"
                }`}
                key={point.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid size-11 place-items-center rounded-xl ${
                    point.status === "AVAILABLE"
                      ? "bg-brand text-white"
                      : "bg-white text-ink-muted"
                  }`}><PlugZap className="size-5" /></span>
                  <Badge
                    tone={
                      point.status === "AVAILABLE"
                        ? "success"
                        : point.status === "UNAVAILABLE"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {chargingStatusLabels[point.status]}
                  </Badge>
                </div>
                <h2 className="mt-4 font-semibold text-ink">{point.id}</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Hỗ trợ xe đạp, xe máy và ô tô điện
                </p>
                <p className="mt-3 text-xs font-medium text-ink-muted">
                  Kỹ thuật: {point.technicalCondition === "GOOD" ? "Tốt" : "Cần bảo trì"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ChargingRegistrationPage() {
  const { data, registerCharging } = useAppStore()
  const params = new URLSearchParams(window.location.search)
  const preferredVehicle =
    data.vehicles.find(
      (vehicle) =>
        vehicle.usageStatus !== "IN_USE" &&
        vehicle.technicalCondition !== "MAJOR_DAMAGE" &&
        !data.chargingRequests.some(
          (request) =>
            request.vehicleId === vehicle.id &&
            ["PENDING", "SCHEDULED", "CHARGING"].includes(request.status),
        ),
    ) ?? data.vehicles[0]
  const [hubId, setHubId] = useState(
    params.get("hub") ?? data.hubs[0]?.id ?? "",
  )
  const [mode, setMode] = useState<"SHARED" | "PRIVATE">("SHARED")
  const [sharedVehicleId, setSharedVehicleId] = useState(
    preferredVehicle?.id ?? "",
  )
  const [privateVehicleId, setPrivateVehicleId] = useState("")
  const [privateType, setPrivateType] =
    useState<VehicleType>("ELECTRIC_MOTORCYCLE")
  const [start, setStart] = useState(futureLocalDateTime(3))
  const [end, setEnd] = useState(futureLocalDateTime(5))
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(
    null,
  )
  const sharedVehicle = data.vehicles.find(
    (item) => item.id === sharedVehicleId,
  )
  const type =
    mode === "SHARED"
      ? sharedVehicle?.type ?? "ELECTRIC_BICYCLE"
      : privateType
  const vehicleId =
    mode === "SHARED" ? sharedVehicleId : privateVehicleId.trim()
  const availablePoints = data.chargingPoints.filter(
    (item) =>
      item.hubId === hubId &&
      item.status === "AVAILABLE" &&
      item.compatibleVehicleTypes.includes(type) &&
      item.technicalCondition !== "MAJOR_DAMAGE",
  )

  const submit = () => {
    setNotice(
      registerCharging({
        hubId,
        vehicleId,
        vehicleType: type,
        requestedTime: { start, end },
      }),
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ST-14"
        title="Đăng ký lịch sạc"
        description="Yêu cầu sẽ được xếp lịch ngay khi có cổng sạc tương thích; nếu hết công suất, yêu cầu chuyển sang chờ xử lý."
      />
      {notice ? (
        <Notice tone={notice.ok ? "success" : "error"}>
          {notice.message}
        </Notice>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_.7fr]">
        <Card>
          <CardHeader title="Thông tin yêu cầu" />
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-muted p-1">
              <button
                aria-pressed={mode === "SHARED"}
                className={`h-11 rounded-lg text-sm font-semibold ${
                  mode === "SHARED"
                    ? "bg-white text-ink shadow-sm"
                    : "text-ink-muted"
                }`}
                onClick={() => setMode("SHARED")}
              >
                Xe dùng chung
              </button>
              <button
                aria-pressed={mode === "PRIVATE"}
                className={`h-11 rounded-lg text-sm font-semibold ${
                  mode === "PRIVATE"
                    ? "bg-white text-ink shadow-sm"
                    : "text-ink-muted"
                }`}
                onClick={() => setMode("PRIVATE")}
              >
                Xe cá nhân
              </button>
            </div>
            {mode === "SHARED" ? (
              <SelectField
                label="Phương tiện"
                value={sharedVehicleId}
                onChange={(event) => setSharedVehicleId(event.target.value)}
              >
                {data.vehicles.map((vehicle) => (
                  <option value={vehicle.id} key={vehicle.id}>
                    {vehicle.id} • {vehicleTypeLabels[vehicle.type]} • Pin {vehicle.batteryLevel}%
                  </option>
                ))}
              </SelectField>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Biển số hoặc mã xe"
                  value={privateVehicleId}
                  onChange={(event) => setPrivateVehicleId(event.target.value)}
                  placeholder="59-X1-12345"
                />
                <SelectField
                  label="Loại phương tiện"
                  value={privateType}
                  onChange={(event) =>
                    setPrivateType(event.target.value as VehicleType)
                  }
                >
                  {Object.entries(vehicleTypeLabels).map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </SelectField>
              </div>
            )}
            <SelectField
              label="Mobility Hub"
              value={hubId}
              onChange={(event) => setHubId(event.target.value)}
            >
              {data.hubs.map((hub) => (
                <option value={hub.id} key={hub.id}>{hub.name}</option>
              ))}
            </SelectField>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Bắt đầu mong muốn"
                type="datetime-local"
                value={start}
                onChange={(event) => setStart(event.target.value)}
              />
              <TextInput
                label="Kết thúc mong muốn"
                type="datetime-local"
                value={end}
                onChange={(event) => setEnd(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Tóm tắt khả dụng" />
          <CardContent className="space-y-5">
            <span className={`mx-auto grid size-20 place-items-center rounded-3xl ${
              availablePoints.length
                ? "bg-brand-soft text-brand"
                : "bg-amber-50 text-warning"
            }`}>
              <Zap className="size-10" />
            </span>
            <div className="text-center">
              <p className="text-3xl font-bold text-ink">
                {availablePoints.length}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                cổng sạc tương thích đang trống
              </p>
            </div>
            {availablePoints.length ? (
              <Notice tone="success">
                Yêu cầu có thể được xếp lịch ngay.
              </Notice>
            ) : (
              <Notice tone="warning">
                Yêu cầu vẫn được tiếp nhận nhưng sẽ chờ tài nguyên.
              </Notice>
            )}
            <Button
              className="w-full"
              disabled={!vehicleId || !start || !end}
              onClick={submit}
            >
              Gửi yêu cầu sạc
            </Button>
            {notice?.ok ? (
              <Link
                className="button-secondary w-full"
                to="/student/charging/my-requests"
              >
                Xem lịch sạc của tôi
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function MyChargingSchedulePage() {
  const { data, currentUser, cancelChargingRequest } = useAppStore()
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(
    null,
  )
  const [view, setView] = useState<"LIST" | "TIMELINE">("LIST")
  const requests = useMemo(
    () =>
      data.chargingRequests
        .filter((item) => item.userId === currentUser?.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [currentUser?.id, data.chargingRequests],
  )
  const cancel = (id: string) => {
    if (!window.confirm("Bạn có chắc muốn hủy yêu cầu sạc này?")) return
    setNotice(cancelChargingRequest(id))
  }
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ST-15"
        title="Lịch sạc của tôi"
        description="Theo dõi yêu cầu, lịch đã phân bổ và trạng thái sạc của phương tiện."
        action={
          <Link className="button-primary" to="/student/charging/register">
            Đăng ký lịch sạc
          </Link>
        }
      />
      {notice ? (
        <Notice tone={notice.ok ? "success" : "error"}>
          {notice.message}
        </Notice>
      ) : null}
      <div className="flex w-fit gap-1 rounded-xl bg-surface-muted p-1">
        <button
          aria-pressed={view === "LIST"}
          className={`flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold ${
            view === "LIST" ? "bg-white text-ink shadow-sm" : "text-ink-muted"
          }`}
          onClick={() => setView("LIST")}
        >
          <CalendarDays className="size-4" /> Danh sách
        </button>
        <button
          aria-pressed={view === "TIMELINE"}
          className={`flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold ${
            view === "TIMELINE"
              ? "bg-white text-ink shadow-sm"
              : "text-ink-muted"
          }`}
          onClick={() => setView("TIMELINE")}
        >
          <Clock3 className="size-4" /> Dòng thời gian
        </button>
      </div>
      {requests.length ? (
        view === "LIST" ? (
          <div className="space-y-4">
            {requests.map((request) => {
              const hub = data.hubs.find((item) => item.id === request.hubId)
              const cancellable = ["ACCEPTED", "PENDING", "SCHEDULED"].includes(
                request.status,
              )
              return (
                <Card key={request.id}>
                  <CardContent className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div className="flex items-start gap-4">
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-info">
                        <BatteryCharging className="size-6" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-ink">{request.id}</h2>
                          <Badge tone={statusTone(request.status)}>
                            {requestStatusLabels[request.status]}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm font-medium text-ink">
                          {request.vehicleId} • {hub?.name}
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                          Cổng sạc: {request.resourceId ?? "Chưa phân bổ"}
                        </p>
                        <p className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
                          <CalendarClock className="size-4" />
                          {formatDateTime(request.assignedTime?.start ?? request.requestedTime.start)} – {formatDateTime(request.assignedTime?.end ?? request.requestedTime.end)}
                        </p>
                      </div>
                    </div>
                    {cancellable ? (
                      <Button variant="danger" onClick={() => cancel(request.id)}>
                        Hủy yêu cầu
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardHeader
              title="Dòng thời gian sạc"
              description="Các yêu cầu được sắp theo thời điểm mong muốn."
            />
            <CardContent className="space-y-0">
              {[...requests]
                .sort((a, b) =>
                  a.requestedTime.start.localeCompare(b.requestedTime.start),
                )
                .map((request, index) => (
                  <div className="grid grid-cols-[5rem_1.5rem_1fr] gap-3" key={request.id}>
                    <p className="pt-1 text-right text-xs font-semibold text-ink-muted">
                      {new Intl.DateTimeFormat("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(request.requestedTime.start))}
                    </p>
                    <div className="flex flex-col items-center">
                      <span className={`mt-1 size-3 rounded-full ${
                        request.status === "CANCELLED" ? "bg-unavailable" : "bg-brand"
                      }`} />
                      {index < requests.length - 1 ? (
                        <span className="min-h-20 w-px flex-1 bg-line" />
                      ) : null}
                    </div>
                    <div className="pb-6">
                      <p className="font-semibold text-ink">
                        {request.vehicleId} • {request.resourceId ?? "Chờ phân bổ"}
                      </p>
                      <p className="mt-1 text-sm text-ink-muted">
                        {data.hubs.find((hub) => hub.id === request.hubId)?.name}
                      </p>
                      <Badge tone={statusTone(request.status)}>
                        {requestStatusLabels[request.status]}
                      </Badge>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )
      ) : (
        <EmptyState
          icon={PlugZap}
          title="Chưa có yêu cầu sạc"
          description="Đăng ký thời gian sạc phù hợp cho phương tiện của bạn."
          action={
            <Link className="button-primary" to="/student/charging/register">
              Đăng ký sạc
            </Link>
          }
        />
      )}
    </div>
  )
}
