import {
  BellRing,
  Bike,
  Boxes,
  CalendarCheck,
  CalendarPlus,
  CarFront,
  ChartNoAxesCombined,
  CircleParking,
  ClipboardList,
  Clock3,
  FileText,
  FlaskConical,
  Gauge,
  Grid2X2,
  LayoutDashboard,
  MapPin,
  Plug,
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
  children?: NavigationItem[]
}

export const studentNavigation: NavigationItem[] = [
  { label: "Tổng quan", to: "/student/dashboard", icon: LayoutDashboard },
  { label: "Tìm phương tiện", to: "/student/vehicles", icon: Bike },
  { label: "Mobility Hubs", to: "/student/hubs", icon: MapPin },
  {
    label: "Chỗ đỗ xe",
    to: "/student/parking",
    icon: CircleParking,
    children: [
      { label: "Tình trạng chỗ đỗ", to: "/student/parking", icon: Grid2X2 },
      { label: "Đặt chỗ đỗ xe", to: "/student/parking/reserve", icon: CalendarPlus },
      { label: "Chỗ đỗ đã đặt", to: "/student/parking/my-reservations", icon: ClipboardList },
    ],
  },
  {
    label: "Trạm sạc",
    to: "/student/charging",
    icon: Plug,
    children: [
      { label: "Trạng thái trạm sạc", to: "/student/charging", icon: Zap },
      { label: "Đăng ký lịch sạc", to: "/student/charging/register", icon: CalendarPlus },
      { label: "Lịch sạc của tôi", to: "/student/charging/my-requests", icon: CalendarCheck },
    ],
  },
  {
    label: "Hoạt động của tôi",
    to: "/student/my-booking",
    icon: FileText,
    children: [
      { label: "Xe đã đặt / Đang sử dụng", to: "/student/my-booking", icon: CarFront },
      { label: "Chuyến đi hiện tại", to: "/student/active-trip", icon: Route },
      { label: "Lịch sử sử dụng", to: "/student/history", icon: Clock3 },
      { label: "Chỗ đỗ đã đặt", to: "/student/parking/my-reservations", icon: CircleParking },
      { label: "Lịch sạc của tôi", to: "/student/charging/my-requests", icon: CalendarCheck },
    ],
  },
]

export const operatorNavigation: NavigationItem[] = [
  { label: "Tổng quan vận hành", to: "/operator/dashboard", icon: Gauge },
  { label: "Giám sát mạng lưới", to: "/operator/network", icon: MapPin },
  {
    label: "Giám sát tài nguyên",
    to: "/operator/vehicles",
    icon: Boxes,
    children: [
      { label: "Phương tiện", to: "/operator/vehicles", icon: Bike },
      { label: "Chỗ đỗ", to: "/operator/parking", icon: CircleParking },
      { label: "Cổng sạc", to: "/operator/charging-points", icon: Plug },
      { label: "Tình trạng phân bổ", to: "/operator/resources", icon: ClipboardList },
    ],
  },
  { label: "Quản lý lịch sạc", to: "/operator/charging-schedule", icon: CalendarCheck },
  {
    label: "Cảnh báo & Điều phối",
    to: "/operator/overload-alerts",
    icon: TriangleAlert,
    children: [
      { label: "Cảnh báo quá tải", to: "/operator/overload-alerts", icon: TriangleAlert },
      { label: "Điều phối phương tiện", to: "/operator/redistribution", icon: Route },
    ],
  },
  { label: "Quản lý sự cố", to: "/operator/incidents", icon: Siren },
  {
    label: "Mô phỏng What-if",
    to: "/operator/simulation/new",
    icon: FlaskConical,
    children: [
      { label: "Thiết lập mô phỏng", to: "/operator/simulation/new", icon: FlaskConical },
      { label: "Kết quả mô phỏng", to: "/operator/simulation/results", icon: ChartNoAxesCombined },
      { label: "Đề xuất điều phối", to: "/operator/simulation/recommendations", icon: Zap },
    ],
  },
]

/** Find the Operator menu item corresponding to a route, including detail pages. */
export function getActiveOperatorNavigation(
  pathname: string,
  navigation: NavigationItem[] = operatorNavigation,
): { group: NavigationItem; child?: NavigationItem } | null {
  const matches = (to: string) =>
    pathname === to ||
    pathname.startsWith(to + "/") ||
    (to === "/operator/network" && pathname.startsWith("/operator/hubs/"))

  for (const group of navigation) {
    if (group.children?.length) {
      const child = group.children.find((item) => matches(item.to))
      if (child) return { group, child }
    } else if (matches(group.to)) {
      return { group }
    }
  }
  return null
}

export const moduleIcons = {
  student: CarFront,
  operator: ChartNoAxesCombined,
  notification: BellRing,
}
