import { operatorNavigation } from "@/app/navigation"
import { AppShell } from "./AppShell"

export function OperatorLayout() {
  return (
    <AppShell
      navigation={operatorNavigation}
      portalLabel="Trung tâm vận hành"
    />
  )
}
