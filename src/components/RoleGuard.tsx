import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router"
import { useAppStore } from "@/store/appStore"
import type { UserRole } from "@/types/domain"

export function RoleGuard({
  role,
  children,
}: {
  role: UserRole
  children: ReactNode
}) {
  const { currentUser } = useAppStore()
  const location = useLocation()

  if (!currentUser)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (currentUser.role !== role) return <Navigate to="/403" replace />
  return children
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { currentUser } = useAppStore()
  const location = useLocation()
  if (!currentUser)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
