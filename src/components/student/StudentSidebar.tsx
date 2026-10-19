import { Bell, ChevronDown, LogOut, Settings, UserRound, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, NavLink, useLocation } from "react-router"
import type { NavigationItem } from "@/app/navigation"

interface StudentSidebarProps {
  navigation: NavigationItem[]
  onNavigate?: () => void
  onLogout: () => void
  unreadNotifications: number
}

function matchesRoute(to: string, pathname: string) {
  return pathname === to || pathname.startsWith(to + "/")
}

export function StudentSidebar({
  navigation,
  onNavigate,
  onLogout,
  unreadNotifications,
}: StudentSidebarProps) {
  const { pathname } = useLocation()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initiallyExpanded: Record<string, boolean> = {}
    for (const item of navigation) {
      if (item.children?.length) {
        initiallyExpanded[item.to] = item.children.some((child) =>
          matchesRoute(child.to, pathname),
        )
      }
    }
    return initiallyExpanded
  })

  // Deep links and submenu navigation automatically reveal their parent group.
  // The user can still manually collapse that group while staying on a page.
  useEffect(() => {
    setExpandedGroups((previous) => {
      let next = previous
      for (const item of navigation) {
        if (
          item.children?.some((child) => matchesRoute(child.to, pathname)) &&
          !next[item.to]
        ) {
          next = { ...next, [item.to]: true }
        }
      }
      return next
    })
  }, [navigation, pathname])

  const toggleGroup = (to: string) => {
    setExpandedGroups((previous) => ({
      ...previous,
      [to]: !previous[to],
    }))
  }

  const linkStyle =
    "flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
  const activeLink = "bg-emerald-400/15 text-white ring-1 ring-inset ring-emerald-300/15"
  const idleLink = "text-slate-200 hover:bg-white/10 hover:text-white"

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#091b30] text-white">
      <Link
        to="/student/dashboard"
        onClick={onNavigate}
        className="flex shrink-0 items-center gap-3 px-6 pb-5 pt-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300"
        aria-label="VNUmove - Về tổng quan"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-400 text-[#091b30] shadow-lg shadow-emerald-400/10">
          <Zap className="size-7" strokeWidth={2.2} aria-hidden="true" />
        </span>
        <span className="text-2xl font-extrabold tracking-tight">
          VNU<span className="text-emerald-400">move</span>
        </span>
      </Link>

      <p className="px-6 pb-2 pt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
        Sinh viên
      </p>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-5" aria-label="Điều hướng sinh viên">
        {navigation.map((item, index) => {
          const Icon = item.icon
          const groupActive = matchesRoute(item.to, pathname) ||
            Boolean(item.children?.some((child) => matchesRoute(child.to, pathname)))

          if (!item.children?.length) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  linkStyle + " " + (isActive ? activeLink + " border-l-4 border-emerald-400" : idleLink)
                }
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            )
          }

          const open = Boolean(expandedGroups[item.to])
          const submenuId = "student-submenu-" + index
          return (
            <div key={item.to} className="space-y-1">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={submenuId}
                onClick={() => toggleGroup(item.to)}
                className={
                  linkStyle + " w-full text-left " +
                  (open || groupActive ? "bg-[#1a324f] text-white" : idleLink)
                }
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
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
                    return (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        end
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          "flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] leading-snug transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 " +
                          (isActive ? activeLink : idleLink)
                        }
                      >
                        <ChildIcon className="size-4 shrink-0" aria-hidden="true" />
                        <span>{child.label}</span>
                      </NavLink>
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
        <NavLink
          to="/student/settings"
          onClick={onNavigate}
          className={({ isActive }) => linkStyle + " " + (isActive ? activeLink : idleLink)}
        >
          <Settings className="size-5 shrink-0" aria-hidden="true" />
          <span>Cài đặt</span>
        </NavLink>
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
