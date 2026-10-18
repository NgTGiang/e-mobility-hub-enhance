import type {
  AppState,
  ChargingRequest,
  Notification,
  ParkingReservation,
  TimeInterval,
  User,
  VehicleReservation,
  VehicleType,
} from "@/types/domain"

export interface DomainResult {
  ok: boolean
  message: string
}

export interface DomainMutationResult extends DomainResult {
  data?: AppState
  id?: string
}

export interface ParkingReservationInput {
  hubId: string
  vehicleId: string
  vehicleType: VehicleType
  requestedTime: TimeInterval
}

export interface ChargingRequestInput {
  hubId: string
  vehicleId: string
  vehicleType: VehicleType
  requestedTime: TimeInterval
}

const now = () => new Date().toISOString()
const nextId = (prefix: string, ids: string[]) => {
  const highest = ids.reduce((max, id) => {
    const value = Number(id.split("-").at(-1))
    return Number.isFinite(value) ? Math.max(max, value) : max
  }, 0)
  return `${prefix}-${String(highest + 1).padStart(3, "0")}`
}

function notification(
  data: AppState,
  userId: string,
  title: string,
  message: string,
  type: Notification["type"] = "SUCCESS",
): Notification {
  return {
    id: nextId("NOT", data.notifications.map((item) => item.id)),
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: now(),
  }
}

function requireStudent(user: User | null): DomainResult {
  if (!user || user.role !== "STUDENT") {
    return {
      ok: false,
      message: "Bạn không có quyền thực hiện thao tác sinh viên.",
    }
  }
  return { ok: true, message: "" }
}

function validInterval(interval: TimeInterval): DomainResult {
  if (!interval.start || !interval.end) {
    return { ok: false, message: "Vui lòng chọn đầy đủ thời gian bắt đầu và kết thúc." }
  }
  const start = new Date(interval.start).getTime()
  const end = new Date(interval.end).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return { ok: false, message: "Thời gian đã chọn không hợp lệ." }
  }
  if (start < Date.now()) {
    return { ok: false, message: "Thời gian bắt đầu phải ở tương lai." }
  }
  if (start >= end) {
    return { ok: false, message: "Thời gian kết thúc phải sau thời gian bắt đầu." }
  }
  return { ok: true, message: "" }
}

function overlaps(a: TimeInterval, b: TimeInterval) {
  return new Date(a.start).getTime() < new Date(b.end).getTime() &&
    new Date(b.start).getTime() < new Date(a.end).getTime()
}

export function reserveVehicle(
  data: AppState,
  user: User | null,
  vehicleId: string,
): DomainMutationResult {
  const permission = requireStudent(user)
  if (!permission.ok || !user) return permission

  const vehicle = data.vehicles.find((item) => item.id === vehicleId)
  if (!vehicle) return { ok: false, message: "Không tìm thấy phương tiện." }
  if (vehicle.usageStatus !== "AVAILABLE") {
    return { ok: false, message: "Phương tiện vừa được người khác đặt hoặc đang sử dụng." }
  }
  if (vehicle.technicalCondition === "MAJOR_DAMAGE") {
    return { ok: false, message: "Phương tiện đang gặp sự cố kỹ thuật và không thể đặt." }
  }
  const hub = data.hubs.find((item) => item.id === vehicle.currentHubId)
  if (!hub || hub.operationalStatus === "UNAVAILABLE") {
    return { ok: false, message: "Mobility Hub hiện không thể phục vụ nhận xe." }
  }
  const existing = data.vehicleReservations.find(
    (item) =>
      item.userId === user.id &&
      (item.status === "CONFIRMED" || item.status === "ACTIVE"),
  )
  if (existing) {
    return {
      ok: false,
      message: "Bạn đã có một lượt đặt xe hoặc chuyến đi đang hoạt động.",
    }
  }
  const conflicting = data.vehicleReservations.some(
    (item) =>
      item.resourceId === vehicleId &&
      (item.status === "CONFIRMED" || item.status === "ACTIVE"),
  )
  if (conflicting) {
    return { ok: false, message: "Phương tiện đã có một lượt đặt hợp lệ khác." }
  }

  const timestamp = now()
  const reservation: VehicleReservation = {
    id: nextId("VR", data.vehicleReservations.map((item) => item.id)),
    userId: user.id,
    resourceId: vehicle.id,
    pickupHubId: vehicle.currentHubId,
    status: "CONFIRMED",
    requestedTime: { start: timestamp, end: timestamp },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  const updated: AppState = {
    ...data,
    vehicles: data.vehicles.map((item) =>
      item.id === vehicle.id
        ? { ...item, usageStatus: "RESERVED", lastUpdated: timestamp }
        : item,
    ),
    vehicleReservations: [...data.vehicleReservations, reservation],
    notifications: [
      notification(
        data,
        user.id,
        "Đặt xe thành công",
        `${vehicle.id} đã được giữ tại ${hub.name}.`,
      ),
      ...data.notifications,
    ],
  }
  return {
    ok: true,
    message: "Đặt phương tiện thành công.",
    data: updated,
    id: reservation.id,
  }
}

export function pickupVehicle(
  data: AppState,
  user: User | null,
  reservationId: string,
): DomainMutationResult {
  const permission = requireStudent(user)
  if (!permission.ok || !user) return permission
  const reservation = data.vehicleReservations.find((item) => item.id === reservationId)
  if (!reservation) return { ok: false, message: "Không tìm thấy lượt đặt xe." }
  if (reservation.userId !== user.id) {
    return { ok: false, message: "Chỉ chủ sở hữu lượt đặt mới có thể nhận xe." }
  }
  if (reservation.status !== "CONFIRMED") {
    return { ok: false, message: "Lượt đặt này không còn đủ điều kiện nhận xe." }
  }
  const vehicle = data.vehicles.find((item) => item.id === reservation.resourceId)
  if (!vehicle || vehicle.usageStatus !== "RESERVED") {
    return { ok: false, message: "Trạng thái phương tiện đã thay đổi. Vui lòng thử lại." }
  }
  if (vehicle.technicalCondition === "MAJOR_DAMAGE") {
    return { ok: false, message: "Phương tiện đang gặp sự cố kỹ thuật." }
  }
  const timestamp = now()
  return {
    ok: true,
    message: "Nhận xe thành công. Chuyến đi đã bắt đầu.",
    data: {
      ...data,
      vehicles: data.vehicles.map((item) =>
        item.id === vehicle.id
          ? { ...item, usageStatus: "IN_USE", lastUpdated: timestamp }
          : item,
      ),
      vehicleReservations: data.vehicleReservations.map((item) =>
        item.id === reservation.id
          ? { ...item, status: "ACTIVE", updatedAt: timestamp }
          : item,
      ),
      notifications: [
        notification(
          data,
          user.id,
          "Chuyến đi đã bắt đầu",
          `Bạn đã nhận phương tiện ${vehicle.id}.`,
        ),
        ...data.notifications,
      ],
    },
  }
}

export function cancelVehicleReservation(
  data: AppState,
  user: User | null,
  reservationId: string,
): DomainMutationResult {
  const permission = requireStudent(user)
  if (!permission.ok || !user) return permission
  const reservation = data.vehicleReservations.find((item) => item.id === reservationId)
  if (!reservation || reservation.userId !== user.id) {
    return { ok: false, message: "Bạn không sở hữu lượt đặt xe này." }
  }
  if (reservation.status !== "CONFIRMED") {
    return { ok: false, message: "Chỉ lượt đặt đã xác nhận mới có thể hủy." }
  }
  const timestamp = now()
  return {
    ok: true,
    message: "Đã hủy đặt xe và giải phóng phương tiện.",
    data: {
      ...data,
      vehicles: data.vehicles.map((item) =>
        item.id === reservation.resourceId
          ? { ...item, usageStatus: "AVAILABLE", lastUpdated: timestamp }
          : item,
      ),
      vehicleReservations: data.vehicleReservations.map((item) =>
        item.id === reservation.id
          ? { ...item, status: "CANCELLED", updatedAt: timestamp }
          : item,
      ),
      notifications: [
        notification(
          data,
          user.id,
          "Đã hủy đặt xe",
          `Phương tiện ${reservation.resourceId} đã được giải phóng.`,
          "INFO",
        ),
        ...data.notifications,
      ],
    },
  }
}

export function returnVehicle(
  data: AppState,
  user: User | null,
  destinationHubId: string,
): DomainMutationResult {
  const permission = requireStudent(user)
  if (!permission.ok || !user) return permission
  const reservation = data.vehicleReservations.find(
    (item) => item.userId === user.id && item.status === "ACTIVE",
  )
  if (!reservation) return { ok: false, message: "Bạn không có chuyến đi đang hoạt động." }
  const vehicle = data.vehicles.find((item) => item.id === reservation.resourceId)
  if (!vehicle || vehicle.usageStatus !== "IN_USE") {
    return { ok: false, message: "Không thể xác nhận trạng thái phương tiện đang sử dụng." }
  }
  const destination = data.hubs.find((item) => item.id === destinationHubId)
  if (!destination || destination.operationalStatus === "UNAVAILABLE") {
    return { ok: false, message: "Mobility Hub đích không thể tiếp nhận phương tiện." }
  }

  const ownedParking = data.parkingReservations.find(
    (item) =>
      item.userId === user.id &&
      item.hubId === destinationHubId &&
      item.vehicleId === vehicle.id &&
      item.status === "CONFIRMED",
  )
  const reservedSpace = ownedParking
    ? data.parkingSpaces.find(
        (item) =>
          item.id === ownedParking.resourceId &&
          item.status === "RESERVED" &&
          item.compatibleVehicleTypes.includes(vehicle.type),
      )
    : undefined
  const availableSpace = data.parkingSpaces.find(
    (item) =>
      item.hubId === destinationHubId &&
      item.status === "AVAILABLE" &&
      item.compatibleVehicleTypes.includes(vehicle.type),
  )
  const parkingSpace = reservedSpace ?? availableSpace
  if (!parkingSpace) {
    return {
      ok: false,
      message: "Hub đích không còn chỗ đỗ tương thích. Vui lòng chọn Hub khác.",
    }
  }
  if (vehicle.technicalCondition === "MAJOR_DAMAGE") {
    return {
      ok: false,
      message: "Phương tiện cần được điều phối kỹ thuật trước khi hoàn tất trả xe.",
    }
  }

  const timestamp = now()
  return {
    ok: true,
    message: `Đã trả ${vehicle.id} tại ${destination.name}.`,
    data: {
      ...data,
      vehicles: data.vehicles.map((item) =>
        item.id === vehicle.id
          ? {
              ...item,
              usageStatus: "AVAILABLE",
              currentHubId: destinationHubId,
              lastUpdated: timestamp,
            }
          : item,
      ),
      hubs: data.hubs.map((hub) => ({
        ...hub,
        vehicleIds:
          hub.id === destinationHubId
            ? Array.from(new Set([...hub.vehicleIds, vehicle.id]))
            : hub.vehicleIds.filter((id) => id !== vehicle.id),
        lastUpdated:
          hub.id === destinationHubId || hub.id === vehicle.currentHubId
            ? timestamp
            : hub.lastUpdated,
      })),
      parkingSpaces: data.parkingSpaces.map((item) =>
        item.id === parkingSpace.id
          ? {
              ...item,
              status: "OCCUPIED",
              currentReservationId: ownedParking?.id,
            }
          : item,
      ),
      parkingReservations: data.parkingReservations.map((item) =>
        item.id === ownedParking?.id
          ? { ...item, status: "COMPLETED", updatedAt: timestamp }
          : item,
      ),
      vehicleReservations: data.vehicleReservations.map((item) =>
        item.id === reservation.id
          ? { ...item, status: "COMPLETED", updatedAt: timestamp }
          : item,
      ),
      notifications: [
        notification(
          data,
          user.id,
          "Trả xe thành công",
          `${vehicle.id} đã được ghi nhận tại ${destination.name}.`,
        ),
        ...data.notifications,
      ],
    },
  }
}

export function reserveParking(
  data: AppState,
  user: User | null,
  input: ParkingReservationInput,
): DomainMutationResult {
  const permission = requireStudent(user)
  if (!permission.ok || !user) return permission
  const interval = validInterval(input.requestedTime)
  if (!interval.ok) return interval
  const hub = data.hubs.find((item) => item.id === input.hubId)
  if (!hub || hub.operationalStatus === "UNAVAILABLE") {
    return { ok: false, message: "Mobility Hub không thể tiếp nhận đặt chỗ." }
  }
  if (!input.vehicleId.trim()) {
    return { ok: false, message: "Vui lòng chọn hoặc nhập thông tin phương tiện." }
  }
  const userConflict = data.parkingReservations.some(
    (item) =>
      item.userId === user.id &&
      item.vehicleId === input.vehicleId &&
      item.status === "CONFIRMED" &&
      overlaps(item.requestedTime, input.requestedTime),
  )
  if (userConflict) {
    return { ok: false, message: "Phương tiện đã có chỗ đỗ trong khoảng thời gian này." }
  }
  const space = data.parkingSpaces.find(
    (item) =>
      item.hubId === input.hubId &&
      item.status === "AVAILABLE" &&
      item.compatibleVehicleTypes.includes(input.vehicleType),
  )
  if (!space) {
    return { ok: false, message: "Không còn chỗ đỗ tương thích tại Hub đã chọn." }
  }
  const timestamp = now()
  const reservation: ParkingReservation = {
    id: nextId("PR", data.parkingReservations.map((item) => item.id)),
    userId: user.id,
    resourceId: space.id,
    vehicleId: input.vehicleId,
    hubId: hub.id,
    status: "CONFIRMED",
    requestedTime: input.requestedTime,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  return {
    ok: true,
    message: `Đã giữ chỗ ${space.id} tại ${hub.name}.`,
    id: reservation.id,
    data: {
      ...data,
      parkingSpaces: data.parkingSpaces.map((item) =>
        item.id === space.id
          ? { ...item, status: "RESERVED", currentReservationId: reservation.id }
          : item,
      ),
      parkingReservations: [...data.parkingReservations, reservation],
      notifications: [
        notification(
          data,
          user.id,
          "Đặt chỗ đỗ thành công",
          `${space.id} đã được giữ tại ${hub.name}.`,
        ),
        ...data.notifications,
      ],
    },
  }
}

export function cancelParkingReservation(
  data: AppState,
  user: User | null,
  reservationId: string,
): DomainMutationResult {
  const permission = requireStudent(user)
  if (!permission.ok || !user) return permission
  const reservation = data.parkingReservations.find((item) => item.id === reservationId)
  if (!reservation || reservation.userId !== user.id) {
    return { ok: false, message: "Bạn không sở hữu lượt đặt chỗ này." }
  }
  if (reservation.status !== "CONFIRMED") {
    return { ok: false, message: "Lượt đặt chỗ không còn đủ điều kiện hủy." }
  }
  const space = data.parkingSpaces.find((item) => item.id === reservation.resourceId)
  if (!space || space.status !== "RESERVED" || space.currentReservationId !== reservation.id) {
    return { ok: false, message: "Chỗ đỗ đã được sử dụng hoặc thay đổi trạng thái." }
  }
  const timestamp = now()
  return {
    ok: true,
    message: "Đã hủy và giải phóng chỗ đỗ.",
    data: {
      ...data,
      parkingSpaces: data.parkingSpaces.map((item) =>
        item.id === space.id
          ? { ...item, status: "AVAILABLE", currentReservationId: undefined }
          : item,
      ),
      parkingReservations: data.parkingReservations.map((item) =>
        item.id === reservation.id
          ? { ...item, status: "CANCELLED", updatedAt: timestamp }
          : item,
      ),
      notifications: [
        notification(
          data,
          user.id,
          "Đã hủy chỗ đỗ",
          `${space.id} đã được giải phóng.`,
          "INFO",
        ),
        ...data.notifications,
      ],
    },
  }
}

export function registerCharging(
  data: AppState,
  user: User | null,
  input: ChargingRequestInput,
): DomainMutationResult {
  const permission = requireStudent(user)
  if (!permission.ok || !user) return permission
  const interval = validInterval(input.requestedTime)
  if (!interval.ok) return interval
  const hub = data.hubs.find((item) => item.id === input.hubId)
  if (!hub || hub.operationalStatus === "UNAVAILABLE") {
    return { ok: false, message: "Mobility Hub không thể tiếp nhận yêu cầu sạc." }
  }
  const sharedVehicle = data.vehicles.find((item) => item.id === input.vehicleId)
  if (sharedVehicle && sharedVehicle.technicalCondition === "MAJOR_DAMAGE") {
    return { ok: false, message: "Phương tiện không đủ điều kiện kỹ thuật để đăng ký sạc." }
  }
  if (sharedVehicle?.usageStatus === "IN_USE") {
    return {
      ok: false,
      message: "Phương tiện đang trong chuyến đi nên chưa thể đăng ký lịch sạc.",
    }
  }
  if (!input.vehicleId.trim()) {
    return { ok: false, message: "Vui lòng chọn hoặc nhập thông tin phương tiện." }
  }
  const conflict = data.chargingRequests.some(
    (item) =>
      item.userId === user.id &&
      item.vehicleId === input.vehicleId &&
      ["ACCEPTED", "PENDING", "SCHEDULED", "CHARGING"].includes(item.status) &&
      overlaps(item.requestedTime, input.requestedTime),
  )
  if (conflict) {
    return { ok: false, message: "Phương tiện đã có yêu cầu sạc trùng thời gian." }
  }
  const point = data.chargingPoints.find(
    (item) =>
      item.hubId === input.hubId &&
      item.status === "AVAILABLE" &&
      item.technicalCondition !== "MAJOR_DAMAGE" &&
      item.compatibleVehicleTypes.includes(input.vehicleType),
  )
  const timestamp = now()
  const request: ChargingRequest = {
    id: nextId("CR", data.chargingRequests.map((item) => item.id)),
    userId: user.id,
    resourceId: point?.id,
    vehicleId: input.vehicleId,
    hubId: input.hubId,
    status: point ? "SCHEDULED" : "PENDING",
    requestedTime: input.requestedTime,
    assignedTime: point ? input.requestedTime : undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  return {
    ok: true,
    message: point
      ? `Yêu cầu đã được xếp lịch tại cổng ${point.id}.`
      : "Đã tiếp nhận yêu cầu. Hệ thống đang chờ tài nguyên phù hợp.",
    id: request.id,
    data: {
      ...data,
      chargingPoints: data.chargingPoints.map((item) =>
        item.id === point?.id
          ? { ...item, status: "RESERVED", assignedSessionId: request.id }
          : item,
      ),
      chargingRequests: [...data.chargingRequests, request],
      notifications: [
        notification(
          data,
          user.id,
          point ? "Đã xếp lịch sạc" : "Đã tiếp nhận yêu cầu sạc",
          point
            ? `${input.vehicleId} được xếp lịch tại ${point.id}.`
            : `${input.vehicleId} đang chờ tài nguyên sạc phù hợp.`,
          point ? "SUCCESS" : "INFO",
        ),
        ...data.notifications,
      ],
    },
  }
}

export function cancelChargingRequest(
  data: AppState,
  user: User | null,
  requestId: string,
): DomainMutationResult {
  const permission = requireStudent(user)
  if (!permission.ok || !user) return permission
  const request = data.chargingRequests.find((item) => item.id === requestId)
  if (!request || request.userId !== user.id) {
    return { ok: false, message: "Bạn không sở hữu yêu cầu sạc này." }
  }
  if (!["ACCEPTED", "PENDING", "SCHEDULED"].includes(request.status)) {
    return { ok: false, message: "Yêu cầu đang sạc hoặc đã hoàn tất nên không thể hủy." }
  }
  const point = request.resourceId
    ? data.chargingPoints.find((item) => item.id === request.resourceId)
    : undefined
  if (
    point &&
    point.assignedSessionId !== request.id
  ) {
    return { ok: false, message: "Phân bổ cổng sạc đã thay đổi. Vui lòng tải lại dữ liệu." }
  }
  const timestamp = now()
  return {
    ok: true,
    message: "Đã hủy yêu cầu sạc.",
    data: {
      ...data,
      chargingPoints: data.chargingPoints.map((item) =>
        item.id === point?.id
          ? { ...item, status: "AVAILABLE", assignedSessionId: undefined }
          : item,
      ),
      chargingRequests: data.chargingRequests.map((item) =>
        item.id === request.id
          ? { ...item, status: "CANCELLED", updatedAt: timestamp }
          : item,
      ),
      notifications: [
        notification(
          data,
          user.id,
          "Đã hủy yêu cầu sạc",
          `Yêu cầu ${request.id} đã được hủy.`,
          "INFO",
        ),
        ...data.notifications,
      ],
    },
  }
}
