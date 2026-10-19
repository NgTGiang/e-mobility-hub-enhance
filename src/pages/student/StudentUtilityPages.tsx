import { Clock3, Info, RotateCcw, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"
import { EmptyState, PageHeader, Notice, vehicleTypeLabels } from "@/components/student/StudentUI"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { useAppStore } from "@/store/appStore"

function formatDemoDate(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

export function StudentUsageHistoryPage() {
  const { data, currentUser } = useAppStore()
  const completedTrips = data.vehicleReservations
    .filter((item) => item.userId === currentUser?.id && item.status === "COMPLETED")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ST-16"
        title="Lịch sử sử dụng"
        description="Xem lại các lượt sử dụng phương tiện đã hoàn tất trong dữ liệu demo."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm text-ink-muted">Chuyến đi hoàn tất</p>
          <p className="mt-2 text-3xl font-bold text-ink">{completedTrips.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-muted">Phương tiện đã sử dụng</p>
          <p className="mt-2 text-3xl font-bold text-ink">
            {new Set(completedTrips.map((item) => item.resourceId)).size}
          </p>
        </Card>
      </div>
      <Card>
        <CardHeader
          title="Các chuyến đi trước đây"
          description="Các mốc thời gian dưới đây lấy từ bản ghi mock data, không phải dữ liệu GPS."
        />
        <CardContent className="space-y-3">
          {completedTrips.length ? completedTrips.map((trip) => {
            const vehicle = data.vehicles.find((item) => item.id === trip.resourceId)
            const hub = data.hubs.find((item) => item.id === trip.pickupHubId)
            return (
              <article key={trip.id} className="flex flex-col gap-4 rounded-xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Clock3 className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{trip.resourceId}</p>
                      <Badge tone="success">Hoàn tất</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      {vehicle ? vehicleTypeLabels[vehicle.type] : "Phương tiện demo"} · {hub?.name ?? "Không xác định"}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Mã lượt: {trip.id} · Cập nhật: {formatDemoDate(trip.updatedAt)}
                    </p>
                  </div>
                </div>
                <Link className="button-secondary shrink-0" to={"/student/vehicles/" + trip.resourceId}>
                  Xem phương tiện
                </Link>
              </article>
            )
          }) : (
            <EmptyState
              icon={Clock3}
              title="Chưa có lịch sử sử dụng"
              description="Sau khi hoàn tất trả xe, chuyến đi sẽ xuất hiện tại đây."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function StudentSettingsPage() {
  const { currentUser, resetDemoData } = useAppStore()
  const [message, setMessage] = useState("")
  const reset = () => {
    if (!window.confirm("Đặt lại toàn bộ dữ liệu demo của ứng dụng?")) return
    resetDemoData()
    setMessage("Đã khôi phục dữ liệu demo về trạng thái ban đầu.")
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="TÀI KHOẢN SINH VIÊN"
        title="Cài đặt"
        description="Thông tin phiên demo và các tùy chọn dữ liệu mẫu."
      />
      {message ? <Notice tone="success">{message}</Notice> : null}
      <Card>
        <CardHeader title="Thông tin phiên demo" />
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-surface-muted p-4">
            <ShieldCheck className="size-5 text-brand" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ink">{currentUser?.name}</p>
              <p className="text-sm text-ink-muted">{currentUser?.email}</p>
            </div>
            <Badge tone="info">Sinh viên</Badge>
          </div>
          <p className="flex items-start gap-2 text-sm leading-6 text-ink-muted">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Ứng dụng dùng mock data được lưu trong bộ nhớ trình duyệt. Làm mới trang sẽ đưa dữ liệu và đăng nhập về trạng thái ban đầu.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader title="Quản lý dữ liệu mô phỏng" description="Khôi phục tất cả đặt xe, đặt chỗ và lịch sạc về dữ liệu mẫu ban đầu." />
        <CardContent>
          <Button variant="secondary" icon={RotateCcw} onClick={reset}>Đặt lại dữ liệu demo</Button>
        </CardContent>
      </Card>
    </div>
  )
}
