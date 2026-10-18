import { studentNavigation } from "@/app/navigation"
import { AppShell } from "./AppShell"

export function StudentLayout() {
  return (
    <AppShell navigation={studentNavigation} portalLabel="Cổng sinh viên" />
  )
}
