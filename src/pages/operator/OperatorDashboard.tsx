import {
  Activity,
  BatteryCharging,
  Bike,
  Building2,
  CarFront,
  CircleParking,
  MapPin,
  Route,
  Siren,
  TriangleAlert,
  Zap,
} from "lucide-react"
import { Link } from "react-router"
import {
  CapacityBar,
  OperatorPageHeader,
  getHubMetrics,
} from "@/components/operator/OperatorUI"
import { formatDateTime, vehicleTypeLabels } from "@/components/student/StudentUI"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { KpiCard } from "@/components/ui/KpiCard"
import { useAppStore } from "@/store/appStore"
import type { VehicleType } from "@/types/domain"

export function OperatorDashboard() {
  const { data, metrics } = useAppStore()
  const atRiskHubs = data.hubs.filter(
    (hub) => hub.utilization >= 80 || getHubMetrics(data, hub.id).parkingUsage >= 80,
  )
  const vehicleTypes = (
    ["ELECTRIC_BICYCLE", "ELECTRIC_MOTORCYCLE", "ELECTRIC_CAR"] as VehicleType[]
  ).map((type) => ({
    type,
    count: data.vehicles.filter((item) => item.type === type).length,
  }))
  const parkingUsed = data.parkingSpaces.length - metrics.availableParking
  const chargingUsed = data.chargingPoints.length - metrics.availableCharging
  const activities = [
    ...data.dispatchOperations.map((item) => ({
      id: item.id,
      title: `Điều phối ${item.vehicleIds.length} phương tiện`,
      description: `${item.sourceHubId} → ${item.destinationHubId}`,
      time: item.createdAt,
      icon: Route,
      to: "/operator/resources",
    })),
    ...data.incidents.slice(0, 4).map((item) => ({
      id: item.id,
      title: item.status === "RESOLVED" ? "Sự cố đã xử lý" : "Cập nhật sự cố",
      description: `${item.id} • ${item.resourceId}`,
      time: item.detectedAt,
      icon: Siren,
      to: `/operator/incidents/${item.id}`,
    })),
  ].slice(0, 5)

  return (
    <div className="space-y-6">
      <OperatorPageHeader
        eyebrow="OP-01 • Dữ liệu mô phỏng"
        title="Tổng quan vận hành"
        description="Toàn cảnh tài nguyên và trạng thái mạng lưới lúc 08:30, 18/03/2026."
        action={
          <Link className="button-secondary" to="/operator/network">
            Mở bản đồ mạng lưới
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Tổng Mobility Hub"
          value={data.hubs.length}
          helper={`${data.hubs.filter((item) => item.operationalStatus === "OPERATIONAL").length} Hub hoạt động bình thường`}
          icon={Building2}
        />
        <KpiCard
          label="Tổng phương tiện"
          value={data.vehicles.length}
          helper="Trên toàn mạng lưới"
          icon={CarFront}
          tone="blue"
        />
        <KpiCard
          label="Phương tiện khả dụng"
          value={metrics.availableVehicles}
          helper="Đủ điều kiện kỹ thuật"
          icon={Bike}
        />
        <KpiCard
          label="Đang sử dụng"
          value={metrics.inUseVehicles}
          helper="Chuyến đi đang hoạt động"
          icon={Activity}
          tone="blue"
        />
        <KpiCard
          label="Chỗ đỗ còn trống"
          value={metrics.availableParking}
          helper={`Trên tổng số ${data.parkingSpaces.length} chỗ`}
          icon={CircleParking}
          tone="amber"
        />
        <KpiCard
          label="Cổng sạc khả dụng"
          value={metrics.availableCharging}
          helper={`Trên tổng số ${data.chargingPoints.length} cổng`}
          icon={BatteryCharging}
          tone="green"
        />
        <KpiCard
          label="Hub nguy cơ quá tải"
          value={atRiskHubs.length}
          helper="Theo công suất đỗ và tổng hợp"
          icon={TriangleAlert}
          tone="amber"
        />
        <KpiCard
          label="Sự cố chưa xử lý"
          value={metrics.openIncidents}
          helper="Mới hoặc đang xử lý"
          icon={Siren}
          tone="red"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <Card>
          <CardHeader
            title="Tổng quan mạng lưới"
            description="Sơ đồ 2D mô phỏng vị trí và mức sử dụng của các Hub."
            action={
              <Link className="text-sm font-semibold text-info" to="/operator/network">
                Giám sát chi tiết
              </Link>
            }
          />
          <div className="relative min-h-80 overflow-hidden bg-slate-100">
            <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:22px_22px]" />
            {data.hubs.map((hub, index) => (
              <Link
                key={hub.id}
                to={`/operator/hubs/${hub.id}`}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-line bg-white p-3 shadow-md transition hover:-translate-y-[55%]"
                style={{
                  left: `${18 + (index % 3) * 32}%`,
                  top: `${25 + Math.floor(index / 3) * 50}%`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className={`grid size-8 place-items-center rounded-lg text-white ${hub.utilization >= 80 ? "bg-danger" : "bg-info"}`}>
                    <MapPin className="size-4" />
                  </span>
                  <div>
                    <p className="max-w-36 text-xs font-semibold text-ink">{hub.name.replace("Mobility Hub ", "")}</p>
                    <p className="text-[10px] text-ink-muted">{Math.min(hub.utilization, 100)}% sử dụng</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Cảnh báo ưu tiên"
            description={`${data.alerts.filter((item) => !item.acknowledged).length} cảnh báo đang theo dõi`}
          />
          <CardContent className="space-y-3">
            {data.alerts.slice(0, 4).map((alert) => (
              <Link
                className="block rounded-xl border border-line p-4 transition hover:border-amber-300 hover:bg-amber-50/50"
                to="/operator/overload-alerts"
                key={alert.id}
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-warning">
                    <TriangleAlert className="size-4" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">
                        {data.hubs.find((hub) => hub.id === alert.hubId)?.name}
                      </p>
                      <Badge tone={alert.severity === "CRITICAL" ? "danger" : alert.severity === "WARNING" ? "warning" : "success"}>
                        {alert.severity === "CRITICAL" ? "Nghiêm trọng" : alert.severity === "WARNING" ? "Cảnh báo" : "Bình thường"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-ink-muted">{alert.message}</p>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Phân bố phương tiện" description={`${data.vehicles.length} xe theo loại`} />
          <CardContent className="space-y-5">
            {vehicleTypes.map((item) => (
              <div key={item.type}>
                <div className="mb-2 flex justify-between text-sm"><span className="text-ink-muted">{vehicleTypeLabels[item.type]}</span><strong className="text-ink">{item.count}</strong></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-info" style={{ width: `${(item.count / data.vehicles.length) * 100}%` }} /></div>
              </div>
            ))}
            <Link className="button-secondary w-full" to="/operator/vehicles">Xem đội xe</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Công suất tài nguyên" description="Cùng nguồn dữ liệu với màn hình chi tiết." />
          <CardContent className="space-y-6">
            <CapacityBar value={Math.round((parkingUsed / data.parkingSpaces.length) * 100)} label={`Chỗ đỗ • ${parkingUsed}/${data.parkingSpaces.length} đang dùng`} />
            <CapacityBar value={Math.round((chargingUsed / data.chargingPoints.length) * 100)} label={`Cổng sạc • ${chargingUsed}/${data.chargingPoints.length} đang dùng`} />
            <div className="grid grid-cols-2 gap-3">
              <Link className="button-secondary" to="/operator/parking">Chỗ đỗ</Link>
              <Link className="button-secondary" to="/operator/charging-points">Cổng sạc</Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Hoạt động gần đây" description="Sự cố và điều phối mới nhất." />
          <CardContent className="space-y-4">
            {activities.map((activity) => (
              <Link className="flex items-start gap-3" to={activity.to} key={activity.id}>
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-info"><activity.icon className="size-4" /></span>
                <div><p className="text-sm font-semibold text-ink">{activity.title}</p><p className="mt-1 text-xs text-ink-muted">{activity.description}</p><p className="mt-1 text-[10px] text-slate-400">{formatDateTime(activity.time)}</p></div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
