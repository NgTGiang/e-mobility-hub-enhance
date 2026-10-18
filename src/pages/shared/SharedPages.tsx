import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Home,
  RotateCcw,
  UserRound,
} from "lucide-react"
import { Link, Navigate, useNavigate } from "react-router"
import { BrandMark } from "@/components/BrandMark"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { useAppStore } from "@/store/appStore"

function SharedHeader() {
  const { currentUser } = useAppStore()
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <BrandMark />
        <Link
          className="button-secondary"
          to={
            currentUser?.role === "OPERATOR"
              ? "/operator/dashboard"
              : "/student/dashboard"
          }
        >
          <ArrowLeft className="size-4" /> Về tổng quan
        </Link>
      </div>
    </header>
  )
}

export function AuthRedirectPage() {
  const { currentUser } = useAppStore()
  if (!currentUser) return <Navigate to="/login" replace />
  return (
    <Navigate
      to={
        currentUser.role === "OPERATOR"
          ? "/operator/dashboard"
          : "/student/dashboard"
      }
      replace
    />
  )
}

export function ProfilePage() {
  const { currentUser } = useAppStore()
  const roleLabel =
    currentUser?.role === "OPERATOR" ? "Điều phối viên" : "Sinh viên"
  return (
    <div className="min-h-screen bg-page">
      <SharedHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-5 py-10">
        <Badge tone="success">Tài khoản demo</Badge>
        <h1 className="mt-4 text-3xl font-bold text-ink">Thông tin cá nhân</h1>
        <Card className="mt-7">
          <CardContent>
            <div className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-center">
              <span className="grid size-20 place-items-center rounded-2xl bg-brand-soft text-2xl font-bold text-brand-strong">
                {currentUser?.name.slice(0, 1)}
              </span>
              <div>
                <h2 className="text-xl font-semibold text-ink">
                  {currentUser?.name}
                </h2>
                <p className="mt-1 text-ink-muted">{roleLabel}</p>
              </div>
            </div>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              {[
                ["Mã người dùng", currentUser?.id],
                ["Email", currentUser?.email],
                ["Vai trò", roleLabel],
                ["Đơn vị", currentUser?.affiliation],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    {label}
                  </dt>
                  <dd className="mt-1.5 font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export function NotificationsPage() {
  const { currentUser, data, markNotificationsRead } = useAppStore()
  const notifications = data.notifications.filter(
    (item) =>
      item.userId === currentUser?.id || item.role === currentUser?.role,
  )
  return (
    <div className="min-h-screen bg-page">
      <SharedHeader />
      <main id="main-content" className="mx-auto max-w-4xl px-5 py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge tone="info">
              {notifications.filter((item) => !item.read).length} chưa đọc
            </Badge>
            <h1 className="mt-4 text-3xl font-bold text-ink">Thông báo</h1>
          </div>
          <Button
            variant="secondary"
            disabled={!notifications.some((item) => !item.read)}
            onClick={markNotificationsRead}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        </div>
        <Card className="mt-7">
          <CardHeader
            title="Cập nhật gần đây"
            description="Thông báo phù hợp với vai trò hiện tại."
          />
          <CardContent className="space-y-3">
            {notifications.map((item) => (
              <article
                className={`flex gap-4 rounded-xl border p-4 ${
                  item.read
                    ? "border-line bg-white"
                    : "border-brand/20 bg-brand-soft/30"
                }`}
                key={item.id}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-sm">
                  <Bell className="size-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-ink">{item.title}</h2>
                    {!item.read ? (
                      <span
                        className="size-2 rounded-full bg-brand"
                        aria-label="Chưa đọc"
                      />
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-ink-muted">
                    {item.message}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {new Intl.DateTimeFormat("vi-VN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(item.createdAt))}
                  </p>
                </div>
              </article>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export function ErrorPage({
  code = "404",
}: {
  code?: "403" | "404" | "error"
}) {
  const navigate = useNavigate()
  const content = {
    "403": [
      "Không có quyền truy cập",
      "Tài khoản hiện tại không được phép truy cập khu vực này.",
    ],
    "404": [
      "Không tìm thấy trang",
      "Đường dẫn bạn yêu cầu không tồn tại hoặc đã được thay đổi.",
    ],
    error: [
      "Không thể tải dữ liệu",
      "Đã xảy ra lỗi tạm thời khi đồng bộ dữ liệu mô phỏng.",
    ],
  }[code]
  return (
    <main
      id="main-content"
      className="grid min-h-screen place-items-center bg-page p-5"
    >
      <div className="max-w-lg text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-red-50 text-danger">
          <AlertTriangle className="size-9" />
        </span>
        <p className="mt-6 text-sm font-bold uppercase tracking-widest text-brand">
          {code === "error" ? "Lỗi hệ thống" : `Lỗi ${code}`}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">{content[0]}</h1>
        <p className="mt-3 leading-7 text-ink-muted">{content[1]}</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
          >
            Quay lại
          </Button>
          {code === "error" ? (
            <Button icon={RotateCcw} onClick={() => window.location.reload()}>
              Thử lại
            </Button>
          ) : (
            <Button icon={Home} onClick={() => navigate("/")}>
              Về trang chủ
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
