import {
  BellRing,
  Bike,
  Boxes,
  CarFront,
  ChartNoAxesCombined,
  CircleParking,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  Map,
  Route,
  Siren,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from "lucide-react"

export interface NavigationItem {
  label: string
  to: string
  icon: LucideIcon
}

export const studentNavigation: NavigationItem[] = [
  { label: "Tổng quan", to: "/student/dashboard", icon: LayoutDashboard },
  { label: "Tìm phương tiện", to: "/student/vehicles", icon: Bike },
  { label: "Mobility Hubs", to: "/student/hubs", icon: Map },
  { label: "Chỗ đỗ xe", to: "/student/parking", icon: CircleParking },
  { label: "Trạm sạc", to: "/student/charging", icon: Zap },
  { label: "Hoạt động của tôi", to: "/student/my-booking", icon: Route },
]

export const operatorNavigation: NavigationItem[] = [
  { label: "Dashboard", to: "/operator/dashboard", icon: Gauge },
  { label: "Giám sát mạng lưới", to: "/operator/network", icon: Map },
  { label: "Quản lý tài nguyên", to: "/operator/resources", icon: Boxes },
  { label: "Quản lý lịch sạc", to: "/operator/charging-schedule", icon: Zap },
  {
    label: "Cảnh báo & Điều phối",
    to: "/operator/overload-alerts",
    icon: TriangleAlert,
  },
  { label: "Quản lý sự cố", to: "/operator/incidents", icon: Siren },
  {
    label: "What-if Simulation",
    to: "/operator/simulation/new",
    icon: FlaskConical,
  },
]

export const moduleIcons = {
  student: CarFront,
  operator: ChartNoAxesCombined,
  notification: BellRing,
}
