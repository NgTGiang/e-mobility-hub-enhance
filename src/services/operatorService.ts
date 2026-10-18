import type { DomainMutationResult, DomainResult } from "@/services/studentService"
import type {
  AppState,
  DispatchOperation,
  Notification,
  User,
} from "@/types/domain"

export interface DispatchInput {
  sourceHubId: string
  destinationHubId: string
  vehicleIds: string[]
}

const now = () => new Date().toISOString()

const nextId = (prefix: string, ids: string[]) => {
  const highest = ids.reduce((max, id) => {
    const value = Number(id.split("-").at(-1))
    return Number.isFinite(value) ? Math.max(max, value) : max
  }, 0)
  return `${prefix}-${String(highest + 1).padStart(3, "0")}`
}

function requireOperator(user: User | null): DomainResult {
  if (!user || user.role !== "OPERATOR") {
    return {
      ok: false,
      message: "Bạn không có quyền thực hiện thao tác vận hành.",
    }
  }
  return { ok: true, message: "" }
}

function operatorNotification(
  data: AppState,
  title: string,
  message: string,
  type: Notification["type"] = "SUCCESS",
): Notification {
  return {
    id: nextId("NOT", data.notifications.map((item) => item.id)),
    role: "OPERATOR",
    title,
    message,
    type,
    read: false,
    createdAt: now(),
  }
}

function recalculateUtilization(
  data: AppState,
  parkingSpaces: AppState["parkingSpaces"],
  hubId: string,
) {
  const hubSpaces = parkingSpaces.filter((item) => item.hubId === hubId)
  if (!hubSpaces.length) return 0
  return Math.round(
    (hubSpaces.filter((item) => item.status !== "AVAILABLE").length /
      hubSpaces.length) *
      100,
  )
}

export function dispatchVehicles(
  data: AppState,
  user: User | null,
  input: DispatchInput,
): DomainMutationResult {
  const permission = requireOperator(user)
  if (!permission.ok) return permission
  if (input.sourceHubId === input.destinationHubId) {
    return { ok: false, message: "Hub nguồn và Hub đích phải khác nhau." }
  }
  const source = data.hubs.find((item) => item.id === input.sourceHubId)
  const destination = data.hubs.find(
    (item) => item.id === input.destinationHubId,
  )
  if (!source || !destination) {
    return { ok: false, message: "Không tìm thấy Hub nguồn hoặc Hub đích." }
  }
  if (
    source.operationalStatus === "UNAVAILABLE" ||
    destination.operationalStatus === "UNAVAILABLE"
  ) {
    return { ok: false, message: "Hub tạm ngưng không thể tham gia điều phối." }
  }
  const ids = Array.from(new Set(input.vehicleIds))
  if (!ids.length) {
    return { ok: false, message: "Vui lòng chọn ít nhất một phương tiện." }
  }
  const vehicles = ids.map((id) => data.vehicles.find((item) => item.id === id))
  if (vehicles.some((item) => !item)) {
    return { ok: false, message: "Danh sách phương tiện chứa mã không hợp lệ." }
  }
  const invalidLocation = vehicles.find(
    (item) => item?.currentHubId !== source.id,
  )
  if (invalidLocation) {
    return {
      ok: false,
      message: `${invalidLocation.id} không còn thuộc Hub nguồn.`,
    }
  }
  const invalidStatus = vehicles.find(
    (item) => item?.usageStatus !== "AVAILABLE",
  )
  if (invalidStatus) {
    return {
      ok: false,
      message: `${invalidStatus.id} đang được đặt hoặc sử dụng.`,
    }
  }
  const invalidTechnical = vehicles.find(
    (item) => item?.technicalCondition !== "GOOD",
  )
  if (invalidTechnical) {
    return {
      ok: false,
      message: `${invalidTechnical.id} không đạt điều kiện kỹ thuật để điều phối.`,
    }
  }
  const reservedVehicle = ids.find((id) =>
    data.vehicleReservations.some(
      (reservation) =>
        reservation.resourceId === id &&
        (reservation.status === "CONFIRMED" ||
          reservation.status === "ACTIVE"),
    ),
  )
  if (reservedVehicle) {
    return {
      ok: false,
      message: `${reservedVehicle} đang có lượt đặt hợp lệ.`,
    }
  }
  const availableDestinationSpaces = data.parkingSpaces.filter(
    (item) =>
      item.hubId === destination.id &&
      item.status === "AVAILABLE",
  )
  const remainingSpaces = [...availableDestinationSpaces]
  const selectedDestinationSpaces = []
  for (const vehicle of vehicles) {
    const spaceIndex = remainingSpaces.findIndex(
      (space) =>
        vehicle && space.compatibleVehicleTypes.includes(vehicle.type),
    )
    if (spaceIndex < 0) {
      return {
        ok: false,
        message: `Hub đích không còn chỗ đỗ tương thích cho ${vehicle?.id}.`,
      }
    }
    selectedDestinationSpaces.push(remainingSpaces[spaceIndex])
    remainingSpaces.splice(spaceIndex, 1)
  }
  const sourceOccupiedSpaces = data.parkingSpaces.filter(
    (item) =>
      item.hubId === source.id &&
      item.status === "OCCUPIED" &&
      !item.currentReservationId,
  )
  if (sourceOccupiedSpaces.length < ids.length) {
    return {
      ok: false,
      message:
        "Không đủ bản ghi chỗ đỗ đang sử dụng tại Hub nguồn để bảo toàn phân bổ.",
    }
  }

  const selectedSourceSpaces = sourceOccupiedSpaces.slice(0, ids.length)
  const destinationSpaceIds = new Set(
    selectedDestinationSpaces.map((item) => item.id),
  )
  const sourceSpaceIds = new Set(selectedSourceSpaces.map((item) => item.id))
  const timestamp = now()
  const parkingSpaces = data.parkingSpaces.map((item) =>
    destinationSpaceIds.has(item.id)
      ? { ...item, status: "OCCUPIED" as const }
      : sourceSpaceIds.has(item.id)
        ? {
            ...item,
            status: "AVAILABLE" as const,
            currentReservationId: undefined,
          }
        : item,
  )
  const operation: DispatchOperation = {
    id: nextId(
      "DSP",
      data.dispatchOperations.map((item) => item.id),
    ),
    sourceHubId: source.id,
    destinationHubId: destination.id,
    vehicleIds: ids,
    status: "COMPLETED",
    createdAt: timestamp,
    completedAt: timestamp,
  }
  return {
    ok: true,
    message: `Đã điều phối ${ids.length} phương tiện đến ${destination.name}.`,
    id: operation.id,
    data: {
      ...data,
      vehicles: data.vehicles.map((item) =>
        ids.includes(item.id)
          ? { ...item, currentHubId: destination.id, lastUpdated: timestamp }
          : item,
      ),
      parkingSpaces,
      hubs: data.hubs.map((hub) =>
        hub.id === source.id
          ? {
              ...hub,
              vehicleIds: hub.vehicleIds.filter((id) => !ids.includes(id)),
              utilization: recalculateUtilization(data, parkingSpaces, hub.id),
              lastUpdated: timestamp,
            }
          : hub.id === destination.id
            ? {
                ...hub,
                vehicleIds: Array.from(new Set([...hub.vehicleIds, ...ids])),
                utilization: recalculateUtilization(
                  data,
                  parkingSpaces,
                  hub.id,
                ),
                lastUpdated: timestamp,
              }
            : hub,
      ),
      dispatchOperations: [operation, ...data.dispatchOperations],
      notifications: [
        operatorNotification(
          data,
          "Điều phối hoàn tất",
          `${ids.join(", ")} đã được chuyển từ ${source.name} đến ${destination.name}.`,
        ),
        ...data.notifications,
      ],
    },
  }
}

export function assignChargingRequest(
  data: AppState,
  user: User | null,
  requestId: string,
  chargingPointId: string,
): DomainMutationResult {
  const permission = requireOperator(user)
  if (!permission.ok) return permission
  const request = data.chargingRequests.find((item) => item.id === requestId)
  if (!request) return { ok: false, message: "Không tìm thấy yêu cầu sạc." }
  if (!["PENDING", "ACCEPTED"].includes(request.status)) {
    return {
      ok: false,
      message: "Chỉ yêu cầu đang chờ mới có thể được phân bổ.",
    }
  }
  const point = data.chargingPoints.find(
    (item) => item.id === chargingPointId,
  )
  if (!point || point.status !== "AVAILABLE") {
    return { ok: false, message: "Cổng sạc không còn khả dụng." }
  }
  if (point.hubId !== request.hubId) {
    return { ok: false, message: "Cổng sạc phải thuộc Hub của yêu cầu." }
  }
  const vehicle = data.vehicles.find((item) => item.id === request.vehicleId)
  if (
    vehicle &&
    (!point.compatibleVehicleTypes.includes(vehicle.type) ||
      vehicle.technicalCondition === "MAJOR_DAMAGE")
  ) {
    return {
      ok: false,
      message: "Phương tiện không tương thích hoặc không đủ điều kiện kỹ thuật.",
    }
  }
  const timestamp = now()
  return {
    ok: true,
    message: `Đã xếp ${request.id} vào cổng ${point.id}.`,
    data: {
      ...data,
      chargingPoints: data.chargingPoints.map((item) =>
        item.id === point.id
          ? { ...item, status: "RESERVED", assignedSessionId: request.id }
          : item,
      ),
      chargingRequests: data.chargingRequests.map((item) =>
        item.id === request.id
          ? {
              ...item,
              resourceId: point.id,
              status: "SCHEDULED",
              assignedTime: item.requestedTime,
              updatedAt: timestamp,
            }
          : item,
      ),
      notifications: [
        operatorNotification(
          data,
          "Đã phân bổ lịch sạc",
          `${request.id} được xếp vào ${point.id}.`,
        ),
        ...data.notifications,
      ],
    },
  }
}

export function startIncidentHandling(
  data: AppState,
  user: User | null,
  incidentId: string,
): DomainMutationResult {
  const permission = requireOperator(user)
  if (!permission.ok) return permission
  const incident = data.incidents.find((item) => item.id === incidentId)
  if (!incident) return { ok: false, message: "Không tìm thấy sự cố." }
  if (incident.status !== "OPEN") {
    return { ok: false, message: "Chỉ sự cố mới có thể bắt đầu xử lý." }
  }
  const timestamp = now()
  return {
    ok: true,
    message: "Đã chuyển sự cố sang trạng thái đang xử lý.",
    data: {
      ...data,
      incidents: data.incidents.map((item) =>
        item.id === incident.id ? { ...item, status: "IN_PROGRESS" } : item,
      ),
      vehicles: data.vehicles.map((item) =>
        incident.resourceKind === "VEHICLE" &&
        item.id === incident.resourceId
          ? {
              ...item,
              technicalCondition: "MAJOR_DAMAGE",
              lastUpdated: timestamp,
            }
          : item,
      ),
      chargingPoints: data.chargingPoints.map((item) =>
        incident.resourceKind === "CHARGING_POINT" &&
        item.id === incident.resourceId
          ? { ...item, technicalCondition: "MAJOR_DAMAGE", status: "UNAVAILABLE" }
          : item,
      ),
      parkingSpaces: data.parkingSpaces.map((item) =>
        incident.resourceKind === "PARKING_SPACE" &&
        item.id === incident.resourceId
          ? { ...item, status: "UNAVAILABLE" }
          : item,
      ),
      hubs: data.hubs.map((item) =>
        incident.resourceKind === "HUB" && item.id === incident.resourceId
          ? { ...item, operationalStatus: "LIMITED", lastUpdated: timestamp }
          : item,
      ),
    },
  }
}

export function resolveIncident(
  data: AppState,
  user: User | null,
  incidentId: string,
  notes: string,
): DomainMutationResult {
  const permission = requireOperator(user)
  if (!permission.ok) return permission
  const incident = data.incidents.find((item) => item.id === incidentId)
  if (!incident) return { ok: false, message: "Không tìm thấy sự cố." }
  if (incident.status !== "IN_PROGRESS") {
    return {
      ok: false,
      message: "Sự cố phải được tiếp nhận xử lý trước khi đóng.",
    }
  }
  if (notes.trim().length < 10) {
    return {
      ok: false,
      message: "Ghi chú xử lý phải có ít nhất 10 ký tự.",
    }
  }
  const hasOtherBlockingIncident = data.incidents.some(
    (item) =>
      item.id !== incident.id &&
      item.resourceId === incident.resourceId &&
      item.status !== "RESOLVED",
  )
  const timestamp = now()
  const shouldRestore = !hasOtherBlockingIncident
  const assignedChargingRequest = data.chargingRequests.find(
    (item) =>
      item.id ===
      data.chargingPoints.find(
        (point) => point.id === incident.resourceId,
      )?.assignedSessionId,
  )
  return {
    ok: true,
    message: shouldRestore
      ? "Đã đóng sự cố và khôi phục tài nguyên sau xác nhận."
      : "Đã đóng sự cố; tài nguyên vẫn bị khóa do còn sự cố khác.",
    data: {
      ...data,
      incidents: data.incidents.map((item) =>
        item.id === incident.id
          ? { ...item, status: "RESOLVED", resolutionNotes: notes.trim() }
          : item,
      ),
      vehicles: data.vehicles.map((item) =>
        shouldRestore &&
        incident.resourceKind === "VEHICLE" &&
        item.id === incident.resourceId
          ? { ...item, technicalCondition: "GOOD", lastUpdated: timestamp }
          : item,
      ),
      chargingPoints: data.chargingPoints.map((item) =>
        shouldRestore &&
        incident.resourceKind === "CHARGING_POINT" &&
        item.id === incident.resourceId
          ? {
              ...item,
              technicalCondition: "GOOD",
              status: assignedChargingRequest
                ? assignedChargingRequest.status === "CHARGING"
                  ? "CHARGING"
                  : "RESERVED"
                : "AVAILABLE",
            }
          : item,
      ),
      parkingSpaces: data.parkingSpaces.map((item) =>
        shouldRestore &&
        incident.resourceKind === "PARKING_SPACE" &&
        item.id === incident.resourceId
          ? {
              ...item,
              status: item.currentReservationId ? "RESERVED" : "AVAILABLE",
            }
          : item,
      ),
      hubs: data.hubs.map((item) =>
        shouldRestore &&
        incident.resourceKind === "HUB" &&
        item.id === incident.resourceId
          ? { ...item, operationalStatus: "OPERATIONAL", lastUpdated: timestamp }
          : item,
      ),
      notifications: [
        operatorNotification(
          data,
          "Sự cố đã được xử lý",
          `${incident.id} đã được đóng với xác nhận kỹ thuật.`,
        ),
        ...data.notifications,
      ],
    },
  }
}
