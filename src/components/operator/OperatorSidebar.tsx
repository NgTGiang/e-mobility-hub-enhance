import { Bell, ChevronDown, LogOut, UserRound, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router"
import {
  getActiveOperatorNavigation,
  type NavigationItem,
} from "@/app/navigation"

interface OperatorSidebarProps {
  navigation: NavigationItem[]
  onNavigate?: () => void
  onLogout: () => void
  unreadNotifications: number
}

const linkStyle =
  "flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
const activeLink = "bg-emerald-400/15 text-white ring-1 ring-inset ring-emerald-300/15"
const idleLink = "text-slate-200 hover:bg-white/10 hover:text-white"

export function OperatorSidebar({
  navigation,
  onNavigate,
  onLogout,
  unreadNotifications,
}: OperatorSidebarProps) {
  const { pathname } = useLocation()
  const selected = getActiveOperatorNavigation(pathname, navigation)
  const selectedGroup = selected?.group.to
  const selectedChild = selected?.child?.to
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(
      navigation
        .filter((item) => item.children?.length)
        .map((item) => [item.to, item.to === selectedGroup]),
    ),
  )

  // Keep the correct submenu visible after direct links or navigation to a detail page.
  // A manually collapsed group stays collapsed until the pathname changes.
  useEffect(() => {
    if (!selectedChild || !selectedGroup) return
    setExpandedGroups((previous) =>
      previous[selectedGroup]
        ? previous
        : { ...previous, [selectedGroup]: true },
    )
  }, [pathname, selectedChild, selectedGroup])

  const toggleGroup = (to: string) =>
    setExpandedGroups((previous) => ({ ...previous, [to]: !previous[to] }))

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#091b30] text-white">
      <Link
        to="/operator/dashboard"
        onClick={onNavigate}
        className="flex shrink-0 items-center gap-3 px-6 pb-5 pt-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300"
        aria-label="VNUmove - Về tổng quan vận hành"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-400 text-[#091b30] shadow-lg shadow-emerald-400/10">
          <Zap className="size-7" strokeWidth={2.2} aria-hidden="true" />
        </span>
        <span className="text-2xl font-extrabold tracking-tight">
          VNU<span className="text-emerald-400">move</span>
        </span>
      </Link>

      <p className="px-6 pb-2 pt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
        Điều phối viên
      </p>

      <nav
        className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-5"
        aria-label="Điều hướng điều phối viên"
      >
        {navigation.map((item, index) => {
          const Icon = item.icon
          const isGroupActive = selectedGroup === item.to

          if (!item.children?.length) {
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                aria-current={isGroupActive ? "page" : undefined}
                className={
                  linkStyle + " " +
                  (isGroupActive ? activeLink + " border-l-4 border-emerald-400" : idleLink)
                }
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            )
          }

          const open = Boolean(expandedGroups[item.to])
          const submenuId = "operator-submenu-" + index

          return (
            <div key={item.to} className="space-y-1">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={submenuId}
                onClick={() => toggleGroup(item.to)}
                className={
                  linkStyle + " w-full text-left " +
                  (isGroupActive || open ? "bg-[#1a324f] text-white" : idleLink)
                }
              >
                <Icon
                  className={"size-5 shrink-0 " + (isGroupActive ? "text-emerald-300" : "")}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">{item.label}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={"size-4 shrink-0 transition-transform " + (open ? "rotate-180" : "")}
                />
              </button>

              {open ? (
                <div id={submenuId} className="ml-5 space-y-0.5 border-l border-slate-500/60 pb-2 pl-3">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon
                    const active = selectedChild === child.to
                    return (
                      <Link
                        key={child.to}
                        to={child.to}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={
                          "flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] leading-snug transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 " +
                          (active ? activeLink : idleLink)
                        }
                      >
                        <ChildIcon className="size-4 shrink-0" aria-hidden="true" />
                        <span>{child.label}</span>
                      </Link>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-600/60 px-3 pb-4 pt-3">
        <Link to="/notifications" onClick={onNavigate} className={linkStyle + " " + idleLink}>
          <Bell className="size-5 shrink-0" aria-hidden="true" />
          <span className="flex-1">Thông báo</span>
          {unreadNotifications > 0 ? (
            <span className="grid min-w-6 place-items-center rounded-full bg-rose-500 px-1.5 py-0.5 text-xs font-bold text-white">
              {unreadNotifications}
            </span>
          ) : null}
        </Link>
        <Link to="/profile" onClick={onNavigate} className={linkStyle + " " + idleLink}>
          <UserRound className="size-5 shrink-0" aria-hidden="true" />
          <span>Thông tin cá nhân</span>
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className={linkStyle + " w-full text-left " + idleLink}
        >
          <LogOut className="size-5 shrink-0" aria-hidden="true" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  )
}
