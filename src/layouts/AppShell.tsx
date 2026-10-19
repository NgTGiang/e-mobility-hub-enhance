import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  RotateCcw,
  Settings,
  UserRound,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router"
import { BrandMark } from "@/components/BrandMark"
import { StudentSidebar } from "@/components/student/StudentSidebar"
import { Button } from "@/components/ui/Button"
import { useAppStore } from "@/store/appStore"
import type { NavigationItem } from "@/app/navigation"

interface AppShellProps {
  navigation: NavigationItem[]
  portalLabel: string
}

function SidebarContent({
  navigation,
  onNavigate,
  studentMode = false,
  onLogout,
  unreadNotifications = 0,
}: {
  navigation: NavigationItem[]
  onNavigate?: () => void
  studentMode?: boolean
  onLogout: () => void
  unreadNotifications?: number
}) {
  if (studentMode) {
    return (
      <StudentSidebar
        navigation={navigation}
        onNavigate={onNavigate}
        onLogout={onLogout}
        unreadNotifications={unreadNotifications}
      />
    )
  }
  return (
    <>
      <div className="border-b border-line p-5">
        <BrandMark />
      </div>
      <nav
        className="flex-1 space-y-1 overflow-y-auto p-3"
        aria-label="Điều hướng chính"
      >
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                isActive
                  ? "bg-brand-soft text-brand-strong"
                  : "text-ink-muted hover:bg-surface-muted hover:text-ink"
              }`
            }
          >
            <item.icon className="size-5" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line p-4">
        <div className="rounded-xl bg-surface-muted p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-strong">
            <span className="size-2 rounded-full bg-success" />
            Dữ liệu mô phỏng
          </div>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            Cập nhật lần cuối: 08:30, 18/03/2026
          </p>
        </div>
      </div>
    </>
  )
}

export function AppShell({ navigation, portalLabel }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const { currentUser, metrics, logout, resetDemoData } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()
  const isStudent = currentUser?.role === "STUDENT"

  useEffect(() => {
    if (!mobileOpen && !userOpen) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false)
        setUserOpen(false)
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [mobileOpen, userOpen])

  const currentLabel =
    navigation
      .flatMap((item) => [item, ...(item.children ?? [])])
      .filter((item) =>
        location.pathname === item.to || location.pathname.startsWith(item.to + "/"),
      )
      .sort((a, b) => b.to.length - a.to.length)[0]?.label ?? portalLabel

  const handleLogout = () => {
    logout()
    navigate("/")
  }
  const handleReset = () => {
    if (!window.confirm("Đặt lại toàn bộ dữ liệu mô phỏng về trạng thái ban đầu?")) {
      return
    }
    resetDemoData()
    setUserOpen(false)
  }

  return (
    <div className="min-h-screen bg-page text-ink">
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r transition-[width] lg:flex ${isStudent ? "border-white/10 bg-[#091b30] text-white" : "border-line bg-white"} ${
          desktopCollapsed ? "w-20" : isStudent ? "w-72" : "w-64"
        }`}
      >
        {desktopCollapsed ? (
          <>
            <div className="grid h-20 place-items-center border-b border-line">
              <BrandMark compact />
            </div>
            <nav
              className="flex-1 space-y-2 p-3"
              aria-label="Điều hướng thu gọn"
            >
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={({ isActive }) =>
                    `grid size-12 place-items-center rounded-xl transition ${
                      isActive
                        ? isStudent
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "bg-brand-soft text-brand-strong"
                        : isStudent
                          ? "text-slate-300 hover:bg-white/10 hover:text-white"
                          : "text-ink-muted hover:bg-surface-muted"
                    }`
                  }
                >
                  <item.icon className="size-5" aria-hidden="true" />
                  <span className="sr-only">{item.label}</span>
                </NavLink>
              ))}
            </nav>
            {isStudent ? (
              <div className="flex flex-col items-center gap-1 border-t border-white/10 p-2">
                <Link to="/notifications" aria-label="Thông báo" title="Thông báo" className="relative grid size-11 place-items-center rounded-xl text-slate-300 hover:bg-white/10">
                  <Bell className="size-5" />
                  {metrics.unreadNotifications > 0 ? (
                    <span className="absolute right-0 top-0 grid min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{metrics.unreadNotifications}</span>
                  ) : null}
                </Link>
                <Link to="/profile" aria-label="Thông tin cá nhân" title="Thông tin cá nhân" className="grid size-11 place-items-center rounded-xl text-slate-300 hover:bg-white/10"><UserRound className="size-5" /></Link>
                <Link to="/student/settings" aria-label="Cài đặt" title="Cài đặt" className="grid size-11 place-items-center rounded-xl text-slate-300 hover:bg-white/10"><Settings className="size-5" /></Link>
                <button type="button" onClick={handleLogout} aria-label="Đăng xuất" title="Đăng xuất" className="grid size-11 place-items-center rounded-xl text-slate-300 hover:bg-white/10"><LogOut className="size-5" /></button>
              </div>
            ) : null}
          </>
        ) : (
          <SidebarContent navigation={navigation} studentMode={isStudent} onLogout={handleLogout} unreadNotifications={metrics.unreadNotifications} />
        )}
      </aside>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Điều hướng di động"
        >
          <button
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng điều hướng"
          />
          <aside className={isStudent ? "relative flex h-full w-[min(86vw,20rem)] flex-col bg-[#091b30] text-white shadow-2xl" : "relative flex h-full w-[min(86vw,20rem)] flex-col bg-white shadow-2xl"}>
            <Button
              variant="ghost"
              className={isStudent ? "absolute right-3 top-3 z-10 !px-3 !text-white" : "absolute right-3 top-3 z-10 !px-3"}
              onClick={() => setMobileOpen(false)}
              aria-label="Đóng"
              autoFocus
            >
              <X className="size-5" />
            </Button>
            <SidebarContent
              navigation={navigation}
              onNavigate={() => setMobileOpen(false)}
              studentMode={isStudent}
              onLogout={handleLogout}
              unreadNotifications={metrics.unreadNotifications}
            />
          </aside>
        </div>
      ) : null}

      <div
        className={`transition-[padding] ${
          desktopCollapsed ? "lg:pl-20" : isStudent ? "lg:pl-72" : "lg:pl-64"
        }`}
      >
        <header className="sticky top-0 z-20 flex h-18 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur md:px-7">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="!px-3 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Mở điều hướng"
              icon={Menu}
            >
              <span className="sr-only">Mở điều hướng</span>
            </Button>
            <Button
              variant="ghost"
              className="hidden !px-3 lg:inline-flex"
              onClick={() => setDesktopCollapsed((value) => !value)}
              aria-label="Thu gọn điều hướng"
              icon={PanelLeftClose}
            >
              <span className="sr-only">Thu gọn điều hướng</span>
            </Button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                {portalLabel}
              </p>
              <p className="font-semibold text-ink">{currentLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/notifications"
              className="relative grid size-11 place-items-center rounded-xl text-ink-muted transition hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
              aria-label={`${metrics.unreadNotifications} thông báo chưa đọc`}
            >
              <Bell className="size-5" />
              {metrics.unreadNotifications ? (
                <span className="absolute right-2 top-2 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {metrics.unreadNotifications}
                </span>
              ) : null}
            </Link>
            <div className="relative">
              <Button
                variant="ghost"
                className="gap-2 !px-2"
                onClick={() => setUserOpen((value) => !value)}
                aria-expanded={userOpen}
                aria-haspopup="menu"
                aria-label="Mở trình đơn tài khoản"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-sm font-bold text-brand-strong">
                  {currentUser?.name.slice(0, 1)}
                </span>
                <span className="hidden max-w-36 truncate text-left text-sm md:block">
                  {currentUser?.name}
                </span>
                <ChevronDown className="size-4 text-ink-muted" />
              </Button>
              {userOpen ? (
                <div
                  className="absolute right-0 mt-2 w-60 rounded-2xl border border-line bg-white p-2 shadow-xl"
                  role="menu"
                  aria-label="Trình đơn tài khoản"
                >
                  <div className="border-b border-line px-3 py-2">
                    <p className="text-sm font-semibold text-ink">
                      {currentUser?.name}
                    </p>
                    <p className="truncate text-xs text-ink-muted">
                      {currentUser?.email}
                    </p>
                  </div>
                  <Link
                    className="menu-link"
                    to="/profile"
                    onClick={() => setUserOpen(false)}
                    role="menuitem"
                  >
                    <UserRound className="size-4" /> Thông tin cá nhân
                  </Link>
                  <button
                    className="menu-link w-full"
                    onClick={handleReset}
                    role="menuitem"
                  >
                    <RotateCcw className="size-4" /> Đặt lại dữ liệu demo
                  </button>
                  <button
                    className="menu-link w-full text-danger"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <LogOut className="size-4" /> Đăng xuất
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-[1600px] p-4 md:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
