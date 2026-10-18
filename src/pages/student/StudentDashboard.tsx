import {
  BatteryCharging,
  Bike,
  CircleParking,
  Clock3,
  CalendarClock,
  MapPin,
  PlugZap,
  Search,
} from "lucide-react"
import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import {
  BatteryIndicator,
  VehicleCard,
  formatDateTime,
  requestStatusLabels,
  reservationStatusLabels,
} from "@/components/student/StudentUI"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { KpiCard } from "@/components/ui/KpiCard"
import { useAppStore } from "@/store/appStore"

export function StudentDashboard() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const { currentUser, data, metrics } = useAppStore()
  const nearby = data.hubs.slice(0, 3)
  const upcomingReservations = data.vehicleReservations.filter(
    (item) =>
      item.userId === currentUser?.id && item.status === "CONFIRMED",
  ).length
  const currentVehicleReservation = data.vehicleReservations.find(
    (item) =>
      item.userId === currentUser?.id &&
      (item.status === "CONFIRMED" || item.status === "ACTIVE"),
  )
  const currentVehicle = data.vehicles.find(
    (item) => item.id === currentVehicleReservation?.resourceId,
  )
  const upcomingParking = data.parkingReservations.find(
    (item) =>
      item.userId === currentUser?.id && item.status === "CONFIRMED",
  )
  const upcomingCharging = data.chargingRequests.find(
    (item) =>
      item.userId === currentUser?.id &&
      ["PENDING", "SCHEDULED", "CHARGING"].includes(item.status),
  )
  const recommendations = data.vehicles
    .filter(
      (item) =>
        item.usageStatus === "AVAILABLE" &&
        item.technicalCondition !== "MAJOR_DAMAGE",
    )
    .sort((a, b) => b.batteryLevel - a.batteryLevel)
    .slice(0, 3)
  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    navigate(`/student/vehicles?q=${encodeURIComponent(searchQuery)}`)
  }
  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge tone="success">Dữ liệu mô phỏng</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">
            Chào buổi sáng, {currentUser?.name.split(" ").at(-1)}
          </h1>
          <p className="mt-1 text-ink-muted">
            Sẵn sàng cho một hành trình xanh hôm nay?
          </p>
        </div>
        <Link className="button-primary" to="/student/vehicles">
          <Search className="size-4" /> Tìm phương tiện
        </Link>
      </section>

      <form
        className="flex flex-col gap-3 rounded-2xl border border-brand/20 bg-white p-3 shadow-card sm:flex-row"
        onSubmit={submitSearch}
      >
        <label className="relative flex-1">
          <span className="sr-only">Tìm theo vị trí, Mobility Hub hoặc mã xe</span>
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-muted" />
          <input
            className="min-h-12 w-full rounded-xl bg-surface-muted pl-12 pr-4 text-sm text-ink outline-none focus:ring-4 focus:ring-brand/10"
            placeholder="Tìm theo vị trí, Mobility Hub hoặc mã xe..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
        <Button type="submit" className="sm:min-w-32">Tìm kiếm</Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Xe khả dụng"
          value={metrics.availableVehicles}
          helper="Trên toàn mạng lưới"
          icon={Bike}
        />
        <KpiCard
          label="Chỗ đỗ còn trống"
          value={metrics.availableParking}
          helper={`Trong ${data.hubs.length} Mobility Hubs`}
          icon={CircleParking}
          tone="blue"
        />
        <KpiCard
          label="Cổng sạc khả dụng"
          value={metrics.availableCharging}
          helper={`Trên ${data.chargingPoints.length} cổng sạc`}
          icon={BatteryCharging}
          tone="amber"
        />
        <KpiCard
          label="Đặt chỗ sắp tới"
          value={upcomingReservations}
          helper="Trong 24 giờ tới"
          icon={Clock3}
          tone="green"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <Card>
          <CardHeader
            title="Mobility Hubs gần bạn"
            description="Tài nguyên được tính trực tiếp từ dữ liệu mô phỏng."
            action={
              <Link
                className="text-sm font-semibold text-brand hover:text-brand-strong"
                to="/student/hubs"
              >
                Xem tất cả
              </Link>
            }
          />
          <CardContent className="grid gap-3">
            {nearby.map((hub, index) => {
              const available = data.vehicles.filter(
                (item) =>
                  item.currentHubId === hub.id &&
                  item.usageStatus === "AVAILABLE",
              ).length
              return (
                <Link
                  className="flex items-center justify-between gap-4 rounded-xl border border-line p-4 transition hover:border-brand/30 hover:bg-brand-soft/30"
                  to={`/student/hubs/${hub.id}`}
                  key={hub.id}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-muted text-brand">
                      <MapPin className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">
                        {hub.name}
                      </p>
                      <p className="mt-1 text-sm text-ink-muted">
                        {(1.2 + index * 0.7).toFixed(1)} km • {available} xe khả
                        dụng
                      </p>
                    </div>
                  </div>
                  <Badge
                    tone={
                      hub.operationalStatus === "OPERATIONAL"
                        ? "success"
                        : "warning"
                    }
                  >
                    {hub.operationalStatus === "OPERATIONAL"
                      ? "Hoạt động"
                      : "Hạn chế"}
                  </Badge>
                </Link>
              )
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader
            title="Thao tác nhanh"
            description="Tiếp tục các quy trình thường dùng."
          />
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              [Bike, "Tìm xe", "/student/vehicles"],
              [MapPin, "Tìm Hub", "/student/hubs"],
              [CircleParking, "Đặt chỗ đỗ", "/student/parking/reserve"],
              [BatteryCharging, "Đăng ký sạc", "/student/charging/register"],
            ].map(([Icon, label, to]) => (
              <Link
                className="grid min-h-28 place-items-center rounded-xl border border-line p-3 text-center transition hover:border-brand/40 hover:bg-brand-soft/40"
                to={String(to)}
                key={String(label)}
              >
                <span>
                  <Icon className="mx-auto size-6 text-brand" />
                  <span className="mt-2 block text-sm font-semibold text-ink">
                    {String(label)}
                  </span>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink">Hoạt động của tôi</h2>
            <p className="mt-1 text-sm text-ink-muted">Các đặt chỗ và lịch sắp tới.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <ActivityCard
            icon={Bike}
            title={
              currentVehicleReservation?.status === "ACTIVE"
                ? "Chuyến đi hiện tại"
                : "Xe đã đặt"
            }
            primary={currentVehicle?.id ?? "Chưa có phương tiện"}
            secondary={
              currentVehicle
                ? `Pin ${currentVehicle.batteryLevel}% • ${reservationStatusLabels[currentVehicleReservation!.status]}`
                : "Tìm xe phù hợp để bắt đầu"
            }
            to={
              currentVehicleReservation?.status === "ACTIVE"
                ? "/student/active-trip"
                : currentVehicleReservation
                  ? "/student/my-booking"
                  : "/student/vehicles"
            }
          />
          <ActivityCard
            icon={CircleParking}
            title="Chỗ đỗ sắp tới"
            primary={upcomingParking?.resourceId ?? "Chưa có chỗ đỗ"}
            secondary={
              upcomingParking
                ? formatDateTime(upcomingParking.requestedTime.start)
                : "Đặt chỗ trước cho hành trình"
            }
            to={
              upcomingParking
                ? "/student/parking/my-reservations"
                : "/student/parking/reserve"
            }
          />
          <ActivityCard
            icon={PlugZap}
            title="Lịch sạc"
            primary={upcomingCharging?.resourceId ?? "Chưa phân bổ cổng"}
            secondary={
              upcomingCharging
                ? requestStatusLabels[upcomingCharging.status]
                : "Đăng ký thời gian sạc"
            }
            to="/student/charging/my-requests"
          />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink">Phương tiện đề xuất</h2>
            <p className="mt-1 text-sm text-ink-muted">Các xe khả dụng có mức pin cao nhất.</p>
          </div>
          <Link className="text-sm font-semibold text-brand hover:text-brand-strong" to="/student/vehicles">Xem tất cả</Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              hubName={
                data.hubs.find((hub) => hub.id === vehicle.currentHubId)?.name ??
                "Không xác định"
              }
              recommendation="Mức pin cao, sẵn sàng sử dụng"
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function ActivityCard({
  icon: Icon,
  title,
  primary,
  secondary,
  to,
}: {
  icon: typeof Bike
  title: string
  primary: string
  secondary: string
  to: string
}) {
  return (
    <Link to={to}>
      <Card className="h-full p-5 transition hover:border-brand/30 hover:shadow-md">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-ink-muted">{title}</p>
            <p className="mt-1 truncate font-semibold text-ink">{primary}</p>
            <p className="mt-2 text-xs text-ink-muted">{secondary}</p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
