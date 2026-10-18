import type {
  AppState,
  ChargingPoint,
  ChargingRequest,
  Incident,
  MobilityHub,
  Notification,
  OperationalAlert,
  ParkingReservation,
  ParkingSpace,
  SimulationScenario,
  User,
  Vehicle,
  VehicleReservation,
  VehicleType,
} from "@/types/domain"

const NOW = "2026-03-18T08:30:00+07:00"
const ALL_TYPES: VehicleType[] = [
  "ELECTRIC_BICYCLE",
  "ELECTRIC_MOTORCYCLE",
  "ELECTRIC_CAR",
]

const users: User[] = [
  {
    id: "USR-ST-001",
    name: "Nguyễn Minh Anh",
    email: "sinhvien@demo.vn",
    role: "STUDENT",
    affiliation: "Trường Đại học Công nghệ Thông tin",
  },
  {
    id: "USR-OP-001",
    name: "Trần Hoàng Nam",
    email: "dieuphoi@demo.vn",
    role: "OPERATOR",
    affiliation: "Trung tâm Điều hành Đô thị ĐHQG-HCM",
  },
  {
    id: "USR-ST-002",
    name: "Lê Gia Huy",
    email: "giahuy@demo.vn",
    role: "STUDENT",
    affiliation: "Trường Đại học Bách khoa",
  },
  {
    id: "USR-ST-003",
    name: "Phạm Khánh Linh",
    email: "khanhlinh@demo.vn",
    role: "STUDENT",
    affiliation: "Trường Đại học Khoa học Tự nhiên",
  },
  {
    id: "USR-ST-004",
    name: "Võ Đức Anh",
    email: "ducanh@demo.vn",
    role: "STUDENT",
    affiliation: "Ký túc xá Khu B",
  },
]

const hubSeed = [
  ["HUB-A", "Mobility Hub Ký túc xá Khu A", "Ký túc xá Khu A"],
  ["HUB-B", "Mobility Hub Ký túc xá Khu B", "Ký túc xá Khu B"],
  ["HUB-BK", "Mobility Hub Bách khoa", "Khu vực Đại học Bách khoa"],
  [
    "HUB-UIT",
    "Mobility Hub Công nghệ Thông tin",
    "Khu vực Đại học Công nghệ Thông tin",
  ],
  [
    "HUB-HCMUS",
    "Mobility Hub Khoa học Tự nhiên",
    "Khu vực Đại học Khoa học Tự nhiên",
  ],
  [
    "HUB-METRO",
    "Mobility Hub Kết nối Metro",
    "Khu vực kết nối giao thông công cộng",
  ],
] as const

const parkingCounts = [7, 7, 7, 7, 6, 6]
const chargerCounts = [3, 3, 3, 2, 2, 2]

const vehicles: Vehicle[] = Array.from({ length: 30 }, (_, index) => {
  const number = index + 1
  const hubId = hubSeed[index % hubSeed.length][0]
  const type: VehicleType =
    index % 5 === 0
      ? "ELECTRIC_CAR"
      : index % 2 === 0
        ? "ELECTRIC_MOTORCYCLE"
        : "ELECTRIC_BICYCLE"
  const status =
    index === 2 || index === 8 || index === 14
      ? "IN_USE"
      : index === 1
        ? "RESERVED"
        : "AVAILABLE"
  return {
    id: `EV-${String(number).padStart(3, "0")}`,
    type,
    batteryLevel: 34 + ((index * 13) % 66),
    technicalCondition:
      index === 26
        ? "MAJOR_DAMAGE"
        : index % 11 === 0
          ? "MINOR_DAMAGE"
          : "GOOD",
    usageStatus: status,
    currentHubId: hubId,
    odometer: 680 + index * 147,
    licensePlate:
      type === "ELECTRIC_BICYCLE"
        ? undefined
        : `59-X${index % 2 ? "M" : "E"}-${String(1200 + index * 17)}`,
    lastUpdated: NOW,
  }
})

const parkingSpaces: ParkingSpace[] = []
hubSeed.forEach(([hubId], hubIndex) => {
  Array.from({ length: parkingCounts[hubIndex] }, (_, index) => {
    const globalIndex = parkingSpaces.length
    const status =
      globalIndex === 4
        ? "UNAVAILABLE"
        : globalIndex % 7 === 0
          ? "RESERVED"
          : globalIndex % 5 === 0
            ? "OCCUPIED"
            : "AVAILABLE"
    parkingSpaces.push({
      id: `PK-${hubId.replace("HUB-", "")}-${String(index + 1).padStart(2, "0")}`,
      hubId,
      status,
      compatibleVehicleTypes:
        index % 3 === 0
          ? ALL_TYPES
          : ["ELECTRIC_BICYCLE", "ELECTRIC_MOTORCYCLE"],
      currentReservationId:
        status === "RESERVED"
          ? `PR-${String(globalIndex + 1).padStart(3, "0")}`
          : undefined,
    })
  })
})

const chargingPoints: ChargingPoint[] = []
hubSeed.forEach(([hubId], hubIndex) => {
  Array.from({ length: chargerCounts[hubIndex] }, (_, index) => {
    const globalIndex = chargingPoints.length
    const status =
      globalIndex === 12
        ? "UNAVAILABLE"
        : globalIndex === 0
          ? "CHARGING"
          : globalIndex === 5 || globalIndex === 6
            ? "RESERVED"
            : "AVAILABLE"
    chargingPoints.push({
      id: `CP-${hubId.replace("HUB-", "")}-${String(index + 1).padStart(2, "0")}`,
      hubId,
      status,
      compatibleVehicleTypes: ALL_TYPES,
      assignedSessionId:
        status === "CHARGING" || status === "RESERVED"
          ? `CR-${String(globalIndex + 1).padStart(3, "0")}`
          : undefined,
      technicalCondition: status === "UNAVAILABLE" ? "MAJOR_DAMAGE" : "GOOD",
    })
  })
})

const vehicleReservations: VehicleReservation[] = [1, 7, 13].map(
  (vehicleIndex, index) => ({
    id: `VR-${String(index + 1).padStart(3, "0")}`,
    userId: "USR-ST-001",
    resourceId: vehicles[vehicleIndex].id,
    pickupHubId: vehicles[vehicleIndex].currentHubId,
    status: index === 0 ? "CONFIRMED" : "COMPLETED",
    requestedTime: {
      start: `2026-03-${18 + index}T09:00:00+07:00`,
      end: `2026-03-${18 + index}T11:00:00+07:00`,
    },
    createdAt: NOW,
    updatedAt: NOW,
  }),
)

;[2, 8, 14].forEach((vehicleIndex, index) => {
  vehicleReservations.push({
    id: `VR-${String(vehicleReservations.length + 1).padStart(3, "0")}`,
    userId: `USR-ST-00${index + 2}`,
    resourceId: vehicles[vehicleIndex].id,
    pickupHubId: vehicles[vehicleIndex].currentHubId,
    status: "ACTIVE",
    requestedTime: {
      start: `2026-03-18T0${7 + index}:00:00+07:00`,
      end: `2026-03-18T${10 + index}:00:00+07:00`,
    },
    createdAt: NOW,
    updatedAt: NOW,
  })
})

const reservedParking = parkingSpaces.filter(
  (space) => space.status === "RESERVED",
)
const parkingReservations: ParkingReservation[] = reservedParking
  .slice(0, 7)
  .map((space, index) => ({
    id: space.currentReservationId!,
    userId: "USR-ST-001",
    resourceId: space.id,
    vehicleId: vehicles[(index + 3) % vehicles.length].id,
    hubId: space.hubId,
    status: "CONFIRMED",
    requestedTime: {
      start: `2026-03-${19 + index}T08:00:00+07:00`,
      end: `2026-03-${19 + index}T12:00:00+07:00`,
    },
    createdAt: NOW,
    updatedAt: NOW,
  }))

const chargingRequests: ChargingRequest[] = Array.from(
  { length: 8 },
  (_, index) => ({
    id: `CR-${String(index + 1).padStart(3, "0")}`,
    userId: "USR-ST-001",
    resourceId:
      index === 0
        ? chargingPoints[0].id
        : index === 1
          ? chargingPoints[5].id
          : index === 2
            ? chargingPoints[6].id
            : undefined,
    vehicleId: vehicles[index].id,
    hubId: vehicles[index].currentHubId,
    status:
      index === 0
        ? "CHARGING"
        : index < 3
          ? "SCHEDULED"
          : index < 6
            ? "PENDING"
            : "COMPLETED",
    requestedTime: {
      start: `2026-03-${19 + index}T13:00:00+07:00`,
      end: `2026-03-${19 + index}T15:00:00+07:00`,
    },
    assignedTime:
      index < 3
        ? {
            start: `2026-03-${19 + index}T13:00:00+07:00`,
            end: `2026-03-${19 + index}T15:00:00+07:00`,
          }
        : undefined,
    createdAt: NOW,
    updatedAt: NOW,
  }),
)

chargingRequests
  .filter((request) => request.resourceId)
  .forEach((request) => {
    const point = chargingPoints.find((item) => item.id === request.resourceId)
    if (point) point.assignedSessionId = request.id
  })

const incidents: Incident[] = [
  {
    id: "INC-001",
    type: "VEHICLE_MALFUNCTION",
    resourceId: "EV-027",
    resourceKind: "VEHICLE",
    hubId: "HUB-BK",
    severity: "CRITICAL",
    status: "OPEN",
    description:
      "Hệ thống truyền động báo lỗi, phương tiện đã bị khóa phân bổ.",
    detectedAt: NOW,
  },
  {
    id: "INC-002",
    type: "CHARGING_POINT_FAILURE",
    resourceId: "CP-HCMUS-02",
    resourceKind: "CHARGING_POINT",
    hubId: "HUB-HCMUS",
    severity: "CRITICAL",
    status: "IN_PROGRESS",
    description: "Cổng sạc mất kết nối điều khiển.",
    detectedAt: NOW,
  },
  {
    id: "INC-003",
    type: "PARKING_RESOURCE_FAILURE",
    resourceId: "PK-A-05",
    resourceKind: "PARKING_SPACE",
    hubId: "HUB-A",
    severity: "WARNING",
    status: "OPEN",
    description: "Cảm biến vị trí đỗ cần kiểm tra.",
    detectedAt: NOW,
  },
  {
    id: "INC-004",
    type: "HUB_OPERATIONAL_PROBLEM",
    resourceId: "HUB-B",
    resourceKind: "HUB",
    hubId: "HUB-B",
    severity: "WARNING",
    status: "IN_PROGRESS",
    description: "Một phần khu vực đang bảo trì.",
    detectedAt: NOW,
  },
  {
    id: "INC-005",
    type: "VEHICLE_MALFUNCTION",
    resourceId: "EV-012",
    resourceKind: "VEHICLE",
    hubId: "HUB-METRO",
    severity: "NORMAL",
    status: "RESOLVED",
    description: "Đã kiểm tra cảnh báo áp suất lốp.",
    detectedAt: NOW,
    resolutionNotes: "Đã hiệu chỉnh và xác nhận vận hành.",
  },
]

const alerts: OperationalAlert[] = hubSeed
  .slice(0, 4)
  .map(([hubId], index) => ({
    id: `ALT-${String(index + 1).padStart(3, "0")}`,
    hubId,
    severity: index === 0 ? "CRITICAL" : index < 3 ? "WARNING" : "NORMAL",
    type:
      index === 0
        ? "CAPACITY"
        : index === 1
          ? "CHARGING_PRESSURE"
          : index === 2
            ? "VEHICLE_IMBALANCE"
            : "INCIDENT",
    message: [
      "Công suất sử dụng dự kiến vượt 90%.",
      "Nhu cầu sạc đang tăng trong khung giờ cao điểm.",
      "Phân bố phương tiện chưa cân bằng.",
      "Theo dõi bảo trì định kỳ.",
    ][index],
    detectedAt: NOW,
    acknowledged: index === 3,
  }))

const scenarios: SimulationScenario[] = [
  {
    id: "SIM-001",
    name: "Nhu cầu tăng tại Ký túc xá Khu A",
    type: "DEMAND_INCREASE",
    targetHubId: "HUB-A",
    demandIncreasePercent: 35,
    disabledChargingPoints: 0,
    parkingCapacityLimit: 7,
    affectedVehicles: 8,
    durationHours: 4,
  },
  {
    id: "SIM-002",
    name: "Giảm công suất sạc tại Hub Bách khoa",
    type: "CHARGER_FAILURE",
    targetHubId: "HUB-BK",
    demandIncreasePercent: 0,
    disabledChargingPoints: 2,
    parkingCapacityLimit: 7,
    affectedVehicles: 4,
    durationHours: 6,
  },
]

const notifications: Notification[] = [
  {
    id: "NOT-001",
    userId: "USR-ST-001",
    title: "Đặt xe thành công",
    message: "EV-002 đã được giữ tại Mobility Hub Ký túc xá Khu B.",
    type: "SUCCESS",
    read: false,
    createdAt: NOW,
  },
  {
    id: "NOT-002",
    role: "OPERATOR",
    title: "Cảnh báo công suất",
    message: "Mobility Hub Ký túc xá Khu A đang tiến gần ngưỡng công suất.",
    type: "WARNING",
    read: false,
    createdAt: NOW,
  },
  {
    id: "NOT-003",
    role: "OPERATOR",
    title: "Sự cố mới",
    message: "Phát hiện lỗi phương tiện EV-027.",
    type: "ERROR",
    read: true,
    createdAt: NOW,
  },
]

const hubs: MobilityHub[] = hubSeed.map(([id, name, location], index) => {
  const hubParking = parkingSpaces.filter((item) => item.hubId === id)
  const unavailable = hubParking.filter(
    (item) => item.status !== "AVAILABLE",
  ).length
  return {
    id,
    name,
    location,
    operationalStatus: id === "HUB-B" ? "LIMITED" : "OPERATIONAL",
    totalParkingCapacity: hubParking.length,
    vehicleIds: vehicles
      .filter((item) => item.currentHubId === id)
      .map((item) => item.id),
    parkingSpaceIds: hubParking.map((item) => item.id),
    chargingPointIds: chargingPoints
      .filter((item) => item.hubId === id)
      .map((item) => item.id),
    utilization:
      Math.round((unavailable / hubParking.length) * 100) + 38 + index * 3,
    lastUpdated: NOW,
  }
})

export const createInitialState = (): AppState => ({
  users: structuredClone(users),
  hubs: structuredClone(hubs),
  vehicles: structuredClone(vehicles),
  parkingSpaces: structuredClone(parkingSpaces),
  chargingPoints: structuredClone(chargingPoints),
  vehicleReservations: structuredClone(vehicleReservations),
  parkingReservations: structuredClone(parkingReservations),
  chargingRequests: structuredClone(chargingRequests),
  incidents: structuredClone(incidents),
  dispatchOperations: [],
  alerts: structuredClone(alerts),
  scenarios: structuredClone(scenarios),
  simulationResults: [],
  recommendations: [],
  notifications: structuredClone(notifications),
})
