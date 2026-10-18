import type { AppState } from "@/types/domain"

export interface InvariantReport {
  valid: boolean
  errors: string[]
}

function duplicateIds(items: { id: string }[]) {
  const seen = new Set<string>()
  return items
    .filter((item) => {
      if (seen.has(item.id)) return true
      seen.add(item.id)
      return false
    })
    .map((item) => item.id)
}

export function validateAppState(data: AppState): InvariantReport {
  const errors: string[] = []
  const collections: [string, { id: string }[]][] = [
    ["người dùng", data.users],
    ["Mobility Hub", data.hubs],
    ["phương tiện", data.vehicles],
    ["chỗ đỗ", data.parkingSpaces],
    ["cổng sạc", data.chargingPoints],
    ["đặt xe", data.vehicleReservations],
    ["đặt chỗ đỗ", data.parkingReservations],
    ["yêu cầu sạc", data.chargingRequests],
    ["sự cố", data.incidents],
    ["điều phối", data.dispatchOperations],
    ["cảnh báo", data.alerts],
    ["kịch bản", data.scenarios],
    ["kết quả mô phỏng", data.simulationResults],
    ["đề xuất", data.recommendations],
    ["thông báo", data.notifications],
  ]
  for (const [name, items] of collections) {
    const duplicates = duplicateIds(items)
    if (duplicates.length) {
      errors.push(`Trùng ID trong ${name}: ${duplicates.join(", ")}`)
    }
  }

  const hubIds = new Set(data.hubs.map((item) => item.id))
  const userIds = new Set(data.users.map((item) => item.id))
  const vehicleIds = new Set(data.vehicles.map((item) => item.id))
  const parkingIds = new Set(data.parkingSpaces.map((item) => item.id))
  const chargingIds = new Set(data.chargingPoints.map((item) => item.id))

  for (const vehicle of data.vehicles) {
    if (!hubIds.has(vehicle.currentHubId)) {
      errors.push(`${vehicle.id} tham chiếu Hub không tồn tại.`)
    }
    if (vehicle.batteryLevel < 0 || vehicle.batteryLevel > 100) {
      errors.push(`${vehicle.id} có mức pin ngoài khoảng 0–100%.`)
    }
    const activeReservations = data.vehicleReservations.filter(
      (item) =>
        item.resourceId === vehicle.id &&
        (item.status === "CONFIRMED" || item.status === "ACTIVE"),
    )
    if (activeReservations.length > 1) {
      errors.push(`${vehicle.id} có nhiều reservation xe đồng thời.`)
    }
    if (
      vehicle.usageStatus === "RESERVED" &&
      !activeReservations.some((item) => item.status === "CONFIRMED")
    ) {
      errors.push(`${vehicle.id} RESERVED nhưng không có reservation CONFIRMED.`)
    }
    if (
      vehicle.usageStatus === "IN_USE" &&
      !activeReservations.some((item) => item.status === "ACTIVE")
    ) {
      errors.push(`${vehicle.id} IN_USE nhưng không có reservation ACTIVE.`)
    }
    if (
      vehicle.usageStatus === "AVAILABLE" &&
      activeReservations.length > 0
    ) {
      errors.push(`${vehicle.id} AVAILABLE nhưng vẫn có reservation hoạt động.`)
    }
  }

  for (const reservation of data.vehicleReservations) {
    if (!userIds.has(reservation.userId)) {
      errors.push(`${reservation.id} tham chiếu người dùng không tồn tại.`)
    }
    if (!vehicleIds.has(reservation.resourceId)) {
      errors.push(`${reservation.id} tham chiếu phương tiện không tồn tại.`)
    }
    if (!hubIds.has(reservation.pickupHubId)) {
      errors.push(`${reservation.id} tham chiếu Hub nhận không tồn tại.`)
    }
  }

  for (const space of data.parkingSpaces) {
    if (!hubIds.has(space.hubId)) {
      errors.push(`${space.id} tham chiếu Hub không tồn tại.`)
    }
    const reservation = space.currentReservationId
      ? data.parkingReservations.find(
          (item) => item.id === space.currentReservationId,
        )
      : undefined
    if (
      space.status === "RESERVED" &&
      (!reservation ||
        reservation.resourceId !== space.id ||
        reservation.status !== "CONFIRMED")
    ) {
      errors.push(`${space.id} RESERVED nhưng reservation không hợp lệ.`)
    }
    if (space.status === "AVAILABLE" && space.currentReservationId) {
      errors.push(`${space.id} AVAILABLE nhưng vẫn giữ reservation.`)
    }
  }

  for (const reservation of data.parkingReservations) {
    if (!userIds.has(reservation.userId)) {
      errors.push(`${reservation.id} tham chiếu người dùng không tồn tại.`)
    }
    if (!parkingIds.has(reservation.resourceId)) {
      errors.push(`${reservation.id} tham chiếu chỗ đỗ không tồn tại.`)
    }
    if (!hubIds.has(reservation.hubId)) {
      errors.push(`${reservation.id} tham chiếu Hub không tồn tại.`)
    }
  }

  for (const point of data.chargingPoints) {
    if (!hubIds.has(point.hubId)) {
      errors.push(`${point.id} tham chiếu Hub không tồn tại.`)
    }
    const request = point.assignedSessionId
      ? data.chargingRequests.find(
          (item) => item.id === point.assignedSessionId,
        )
      : undefined
    if (
      (point.status === "RESERVED" || point.status === "CHARGING") &&
      (!request ||
        request.resourceId !== point.id ||
        request.hubId !== point.hubId ||
        (point.status === "RESERVED" && request.status !== "SCHEDULED") ||
        (point.status === "CHARGING" && request.status !== "CHARGING"))
    ) {
      errors.push(`${point.id} có phiên sạc không nhất quán.`)
    }
    if (point.status === "AVAILABLE" && point.assignedSessionId) {
      errors.push(`${point.id} AVAILABLE nhưng vẫn giữ phiên sạc.`)
    }
  }

  for (const request of data.chargingRequests) {
    if (!userIds.has(request.userId)) {
      errors.push(`${request.id} tham chiếu người dùng không tồn tại.`)
    }
    if (!hubIds.has(request.hubId)) {
      errors.push(`${request.id} tham chiếu Hub không tồn tại.`)
    }
    if (request.resourceId && !chargingIds.has(request.resourceId)) {
      errors.push(`${request.id} tham chiếu cổng sạc không tồn tại.`)
    }
  }

  for (const hub of data.hubs) {
    const actualVehicles = data.vehicles
      .filter((item) => item.currentHubId === hub.id)
      .map((item) => item.id)
      .sort()
    const actualParking = data.parkingSpaces
      .filter((item) => item.hubId === hub.id)
      .map((item) => item.id)
      .sort()
    const actualCharging = data.chargingPoints
      .filter((item) => item.hubId === hub.id)
      .map((item) => item.id)
      .sort()
    if (hub.vehicleIds.slice().sort().join("|") !== actualVehicles.join("|")) {
      errors.push(`${hub.id} có danh sách phương tiện không nhất quán.`)
    }
    if (
      hub.parkingSpaceIds.slice().sort().join("|") !== actualParking.join("|") ||
      hub.totalParkingCapacity !== actualParking.length
    ) {
      errors.push(`${hub.id} có sức chứa chỗ đỗ không nhất quán.`)
    }
    if (
      hub.chargingPointIds.slice().sort().join("|") !==
      actualCharging.join("|")
    ) {
      errors.push(`${hub.id} có danh sách cổng sạc không nhất quán.`)
    }
  }

  return { valid: errors.length === 0, errors }
}
