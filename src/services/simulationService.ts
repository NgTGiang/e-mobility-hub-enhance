import type { DomainMutationResult, DomainResult } from "@/services/studentService"
import type {
  AppState,
  HubSimulationComparison,
  SimulationNetworkMetrics,
  SimulationRecommendation,
  SimulationResult,
  SimulationScenario,
  User,
} from "@/types/domain"

export type SimulationInput = Omit<
  SimulationScenario,
  "id" | "name" | "createdAt"
>

const scenarioNames: Record<SimulationScenario["type"], string> = {
  DEMAND_INCREASE: "Nhu cầu sinh viên tăng đột biến",
  PARKING_CAPACITY: "Mobility Hub đạt giới hạn chỗ đỗ",
  CHARGING_SURGE: "Nhu cầu sạc tăng cao",
  CHARGER_FAILURE: "Cổng sạc gặp sự cố",
  VEHICLE_CONCENTRATION: "Phương tiện tập trung quá mức",
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
      message: "Bạn không có quyền chạy mô phỏng vận hành.",
    }
  }
  return { ok: true, message: "" }
}

function validateInput(data: AppState, input: SimulationInput): DomainResult {
  const hub = data.hubs.find((item) => item.id === input.targetHubId)
  if (!hub) return { ok: false, message: "Mobility Hub mục tiêu không hợp lệ." }
  if (input.durationHours < 1 || input.durationHours > 168) {
    return { ok: false, message: "Thời gian mô phỏng phải từ 1 đến 168 giờ." }
  }
  if (
    ["DEMAND_INCREASE", "CHARGING_SURGE"].includes(input.type) &&
    (input.demandIncreasePercent < 1 || input.demandIncreasePercent > 200)
  ) {
    return { ok: false, message: "Mức tăng nhu cầu phải từ 1% đến 200%." }
  }
  const parkingCount = data.parkingSpaces.filter(
    (item) => item.hubId === hub.id,
  ).length
  if (
    input.type === "PARKING_CAPACITY" &&
    (input.parkingCapacityLimit < 1 ||
      input.parkingCapacityLimit > parkingCount)
  ) {
    return {
      ok: false,
      message: `Giới hạn chỗ đỗ phải từ 1 đến ${parkingCount}.`,
    }
  }
  const chargingCount = data.chargingPoints.filter(
    (item) => item.hubId === hub.id,
  ).length
  if (
    input.type === "CHARGER_FAILURE" &&
    (input.disabledChargingPoints < 1 ||
      input.disabledChargingPoints > chargingCount)
  ) {
    return {
      ok: false,
      message: `Số cổng sạc hỏng phải từ 1 đến ${chargingCount}.`,
    }
  }
  const movableVehicles = data.vehicles.filter(
    (item) =>
      item.currentHubId !== hub.id &&
      item.usageStatus === "AVAILABLE" &&
      item.technicalCondition === "GOOD",
  ).length
  if (
    input.type === "VEHICLE_CONCENTRATION" &&
    (input.affectedVehicles < 1 || input.affectedVehicles > movableVehicles)
  ) {
    return {
      ok: false,
      message: `Số xe ảnh hưởng phải từ 1 đến ${movableVehicles}.`,
    }
  }
  return { ok: true, message: "" }
}

function baselineComparisons(data: AppState): HubSimulationComparison[] {
  return data.hubs.map((hub) => {
    const vehicles = data.vehicles.filter(
      (item) =>
        item.currentHubId === hub.id &&
        item.usageStatus === "AVAILABLE" &&
        item.technicalCondition !== "MAJOR_DAMAGE",
    )
    const parking = data.parkingSpaces.filter((item) => item.hubId === hub.id)
    const charging = data.chargingPoints.filter((item) => item.hubId === hub.id)
    const availableParking = parking.filter(
      (item) => item.status === "AVAILABLE",
    ).length
    const availableCharging = charging.filter(
      (item) => item.status === "AVAILABLE",
    ).length
    return {
      hubId: hub.id,
      baselineUtilization: Math.min(hub.utilization, 100),
      simulatedUtilization: Math.min(hub.utilization, 100),
      baselineVehicles: vehicles.length,
      simulatedVehicles: vehicles.length,
      baselineParking: availableParking,
      simulatedParking: availableParking,
      baselineCharging: availableCharging,
      simulatedCharging: availableCharging,
      vehicleShortage: 0,
      parkingShortage: 0,
      chargingShortage: 0,
    }
  })
}

function networkMetrics(
  comparisons: HubSimulationComparison[],
  simulated: boolean,
): SimulationNetworkMetrics {
  const utilizationKey = simulated
    ? "simulatedUtilization"
    : "baselineUtilization"
  const vehicleKey = simulated ? "simulatedVehicles" : "baselineVehicles"
  const parkingKey = simulated ? "simulatedParking" : "baselineParking"
  const chargingKey = simulated ? "simulatedCharging" : "baselineCharging"
  const availableVehicles = comparisons.reduce(
    (sum, item) => sum + item[vehicleKey],
    0,
  )
  const availableParking = comparisons.reduce(
    (sum, item) => sum + item[parkingKey],
    0,
  )
  const availableCharging = comparisons.reduce(
    (sum, item) => sum + item[chargingKey],
    0,
  )
  return {
    availableVehicles,
    availableParking,
    availableCharging,
    averageUtilization: Math.round(
      comparisons.reduce((sum, item) => sum + item[utilizationKey], 0) /
        comparisons.length,
    ),
    overloadedHubs: comparisons.filter(
      (item) =>
        item[utilizationKey] >= 85 ||
        (simulated &&
          (item.parkingShortage > 0 || item.chargingShortage > 0)),
    ).length,
    serviceCapacity:
      availableVehicles + availableParking + availableCharging,
  }
}

function buildRecommendations(
  data: AppState,
  resultId: string,
  comparisons: HubSimulationComparison[],
  targetHubId: string,
): SimulationRecommendation[] {
  const target = comparisons.find((item) => item.hubId === targetHubId)!
  const targetHub = data.hubs.find((item) => item.id === targetHubId)!
  const donors = comparisons
    .filter((item) => item.hubId !== targetHubId)
    .sort(
      (a, b) =>
        b.simulatedVehicles - a.simulatedVehicles ||
        a.hubId.localeCompare(b.hubId),
    )
  const parkingAlternatives = comparisons
    .filter((item) => item.hubId !== targetHubId)
    .sort(
      (a, b) =>
        b.simulatedParking - a.simulatedParking ||
        a.hubId.localeCompare(b.hubId),
    )
  const chargingAlternatives = comparisons
    .filter((item) => item.hubId !== targetHubId)
    .sort(
      (a, b) =>
        b.simulatedCharging - a.simulatedCharging ||
        a.hubId.localeCompare(b.hubId),
    )
  const recommendations: SimulationRecommendation[] = []
  const add = (
    recommendation: Omit<
      SimulationRecommendation,
      "id" | "resultId" | "status"
    >,
  ) => {
    recommendations.push({
      ...recommendation,
      id: nextId("REC", [
        ...data.recommendations.map((item) => item.id),
        ...recommendations.map((item) => item.id),
      ]),
      resultId,
      status: "PROPOSED",
    })
  }

  if (target.vehicleShortage > 0 || target.simulatedVehicles <= 1) {
    const donor = donors[0]
    const quantity = Math.max(
      1,
      Math.min(
        target.vehicleShortage || 2,
        Math.max(1, donor?.simulatedVehicles - 1),
      ),
    )
    const vehicleIds = data.vehicles
      .filter(
        (item) =>
          item.currentHubId === donor?.hubId &&
          item.usageStatus === "AVAILABLE" &&
          item.technicalCondition === "GOOD",
      )
      .slice(0, quantity)
      .map((item) => item.id)
    add({
      category: "VEHICLE_REDISTRIBUTION",
      priority: "HIGH",
      problem: `${targetHub.name} có nguy cơ thiếu phương tiện khả dụng.`,
      proposedAction: `Xem xét điều phối ${quantity} phương tiện từ ${data.hubs.find((item) => item.id === donor?.hubId)?.name ?? "Hub có nguồn lực phù hợp"}.`,
      affectedResourceIds: [donor?.hubId, targetHubId, ...vehicleIds].filter(
        Boolean,
      ) as string[],
      expectedImpact: `Tăng tối đa ${quantity} xe khả dụng tại Hub mục tiêu.`,
      constraints: [
        "Xe phải khả dụng và đạt điều kiện kỹ thuật.",
        "Hub đích phải còn chỗ đỗ tương thích.",
        "Cần xác nhận lại trong quy trình điều phối.",
      ],
      sourceHubId: donor?.hubId,
      destinationHubId: targetHubId,
    })
  }

  if (target.parkingShortage > 0 || target.simulatedParking <= 1) {
    const alternative = parkingAlternatives[0]
    add({
      category: "ALTERNATIVE_HUB",
      priority: target.parkingShortage > 0 ? "HIGH" : "MEDIUM",
      problem: `${targetHub.name} thiếu công suất chỗ đỗ.`,
      proposedAction: `Đề xuất ${data.hubs.find((item) => item.id === alternative?.hubId)?.name ?? "Hub lân cận"} làm điểm trả thay thế.`,
      affectedResourceIds: [targetHubId, alternative?.hubId].filter(
        Boolean,
      ) as string[],
      expectedImpact: `Giảm áp lực tối đa ${Math.max(1, target.parkingShortage)} vị trí đỗ.`,
      constraints: [
        "Cần thông báo thay đổi cho người dùng.",
        "Không tự động chuyển lượt đặt hiện có.",
      ],
      destinationHubId: alternative?.hubId,
    })
  }

  if (target.chargingShortage > 0 || target.simulatedCharging === 0) {
    const alternative = chargingAlternatives[0]
    add({
      category: "CHARGING_ADJUSTMENT",
      priority: target.chargingShortage > 0 ? "HIGH" : "MEDIUM",
      problem: `${targetHub.name} không đủ công suất sạc trong kịch bản.`,
      proposedAction: `Rà soát hàng đợi và chuyển các phiên hợp lệ sang ${data.hubs.find((item) => item.id === alternative?.hubId)?.name ?? "Hub còn công suất"}.`,
      affectedResourceIds: [targetHubId, alternative?.hubId].filter(
        Boolean,
      ) as string[],
      expectedImpact: `Bổ sung lựa chọn cho ${Math.max(1, target.chargingShortage)} yêu cầu sạc.`,
      constraints: [
        "Phải kiểm tra tương thích cổng sạc.",
        "Không thay đổi phiên đang sạc.",
      ],
      destinationHubId: alternative?.hubId,
    })
  }

  if (target.simulatedUtilization >= 85 && recommendations.length < 3) {
    add({
      category: "RESOURCE_REALLOCATION",
      priority: "MEDIUM",
      problem: `${targetHub.name} đạt ${target.simulatedUtilization}% mức sử dụng mô phỏng.`,
      proposedAction:
        "Tăng tần suất giám sát và chuẩn bị phương án phân bổ tài nguyên theo ca.",
      affectedResourceIds: [targetHubId],
      expectedImpact: "Rút ngắn thời gian phản ứng khi công suất tiếp tục tăng.",
      constraints: [
        "Đây là khuyến nghị theo ngưỡng, không phải tối ưu hóa tự động.",
      ],
    })
  }

  if (!recommendations.length) {
    add({
      category: "RESOURCE_REALLOCATION",
      priority: "LOW",
      problem: "Kịch bản chưa tạo ra thiếu hụt đáng kể.",
      proposedAction:
        "Duy trì phân bổ hiện tại và tiếp tục theo dõi trong thời gian mô phỏng.",
      affectedResourceIds: [targetHubId],
      expectedImpact: "Giữ ổn định chất lượng phục vụ.",
      constraints: ["Đánh giá lại nếu tham số nhu cầu thay đổi."],
    })
  }
  return recommendations
}

export function runSimulation(
  data: AppState,
  user: User | null,
  input: SimulationInput,
): DomainMutationResult {
  const permission = requireOperator(user)
  if (!permission.ok) return permission
  const validation = validateInput(data, input)
  if (!validation.ok) return validation

  const timestamp = now()
  const scenario: SimulationScenario = {
    ...input,
    id: nextId(
      "SIM",
      data.scenarios.map((item) => item.id),
    ),
    name: scenarioNames[input.type],
    createdAt: timestamp,
  }
  const comparisons = baselineComparisons(data)
  const target = comparisons.find((item) => item.hubId === input.targetHubId)!
  const targetParking = data.parkingSpaces.filter(
    (item) => item.hubId === input.targetHubId,
  )
  const targetCharging = data.chargingPoints.filter(
    (item) => item.hubId === input.targetHubId,
  )

  if (input.type === "DEMAND_INCREASE") {
    const extraDemand = Math.max(
      1,
      Math.ceil(
        (Math.max(1, target.baselineVehicles) *
          input.demandIncreasePercent) /
          100,
      ),
    )
    target.simulatedVehicles = Math.max(
      0,
      target.baselineVehicles - extraDemand,
    )
    target.vehicleShortage = Math.max(
      0,
      extraDemand - target.baselineVehicles,
    )
    target.simulatedParking = Math.max(
      0,
      target.baselineParking - Math.ceil(extraDemand / 2),
    )
    target.parkingShortage = Math.max(
      0,
      Math.ceil(extraDemand / 2) - target.baselineParking,
    )
    target.simulatedUtilization = Math.min(
      100,
      target.baselineUtilization +
        Math.round(input.demandIncreasePercent * 0.65),
    )
  }

  if (input.type === "PARKING_CAPACITY") {
    const occupied = targetParking.length - target.baselineParking
    target.simulatedParking = Math.max(
      0,
      input.parkingCapacityLimit - occupied,
    )
    target.parkingShortage = Math.max(
      0,
      occupied - input.parkingCapacityLimit,
    )
    target.simulatedUtilization = Math.min(
      100,
      Math.round(
        (occupied / Math.max(1, input.parkingCapacityLimit)) * 100,
      ),
    )
  }

  if (input.type === "CHARGING_SURGE") {
    const extraRequests = Math.max(
      1,
      Math.ceil(
        (Math.max(1, targetCharging.length) *
          input.demandIncreasePercent) /
          100,
      ),
    )
    target.simulatedCharging = Math.max(
      0,
      target.baselineCharging - extraRequests,
    )
    target.chargingShortage = Math.max(
      0,
      extraRequests - target.baselineCharging,
    )
    target.simulatedUtilization = Math.min(
      100,
      target.baselineUtilization +
        Math.round(input.demandIncreasePercent * 0.45),
    )
  }

  if (input.type === "CHARGER_FAILURE") {
    target.simulatedCharging = Math.max(
      0,
      target.baselineCharging - input.disabledChargingPoints,
    )
    target.chargingShortage = Math.max(
      0,
      input.disabledChargingPoints - target.baselineCharging,
    )
    target.simulatedUtilization = Math.min(
      100,
      target.baselineUtilization +
        Math.round(
          (input.disabledChargingPoints /
            Math.max(1, targetCharging.length)) *
            60,
        ),
    )
  }

  if (input.type === "VEHICLE_CONCENTRATION") {
    const donors = comparisons
      .filter((item) => item.hubId !== input.targetHubId)
      .sort(
        (a, b) =>
          b.baselineVehicles - a.baselineVehicles ||
          a.hubId.localeCompare(b.hubId),
      )
    target.simulatedVehicles += input.affectedVehicles
    target.simulatedParking = Math.max(
      0,
      target.baselineParking - input.affectedVehicles,
    )
    target.parkingShortage = Math.max(
      0,
      input.affectedVehicles - target.baselineParking,
    )
    target.simulatedUtilization = Math.min(
      100,
      target.baselineUtilization +
        Math.round(
          (input.affectedVehicles / Math.max(1, targetParking.length)) * 100,
        ),
    )
    let remainingVehicles = input.affectedVehicles
    for (const donor of donors) {
      const moved = Math.min(donor.baselineVehicles, remainingVehicles)
      donor.simulatedVehicles = donor.baselineVehicles - moved
      remainingVehicles -= moved
      if (remainingVehicles === 0) break
    }
  }

  const baseline = networkMetrics(comparisons, false)
  const simulated = networkMetrics(comparisons, true)
  const resultId = nextId(
    "RES",
    data.simulationResults.map((item) => item.id),
  )
  const bottlenecks: string[] = []
  if (target.vehicleShortage > 0 || target.simulatedVehicles <= 1) {
    bottlenecks.push("Thiếu phương tiện khả dụng tại Hub mục tiêu.")
  }
  if (target.parkingShortage > 0 || target.simulatedParking === 0) {
    bottlenecks.push("Công suất chỗ đỗ không đáp ứng nhu cầu mô phỏng.")
  }
  if (target.chargingShortage > 0 || target.simulatedCharging === 0) {
    bottlenecks.push("Không đủ cổng sạc khả dụng trong giai đoạn đánh giá.")
  }
  if (target.simulatedUtilization >= 85) {
    bottlenecks.push("Mức sử dụng Hub vượt ngưỡng cảnh báo 85%.")
  }
  if (!bottlenecks.length) {
    bottlenecks.push("Không phát hiện nút thắt nghiêm trọng với tham số hiện tại.")
  }
  const result: SimulationResult = {
    id: resultId,
    scenarioId: scenario.id,
    baselineUtilization: target.baselineUtilization,
    simulatedUtilization: target.simulatedUtilization,
    vehicleShortage: target.vehicleShortage,
    parkingShortage: target.parkingShortage,
    chargingShortage: target.chargingShortage,
    baseline,
    simulated,
    hubComparisons: comparisons,
    bottlenecks,
    serviceImpact:
      simulated.serviceCapacity < baseline.serviceCapacity
        ? `Năng lực phục vụ mô phỏng giảm ${baseline.serviceCapacity - simulated.serviceCapacity} đơn vị tài nguyên.`
        : simulated.overloadedHubs > baseline.overloadedHubs
          ? "Số Hub vượt ngưỡng tăng, cần theo dõi chủ động."
          : "Chất lượng phục vụ dự kiến vẫn trong ngưỡng kiểm soát.",
    createdAt: timestamp,
  }
  const recommendations = buildRecommendations(
    data,
    result.id,
    comparisons,
    input.targetHubId,
  )

  return {
    ok: true,
    message: "Mô phỏng hoàn tất trên ảnh chụp trạng thái độc lập.",
    id: result.id,
    data: {
      ...data,
      scenarios: [...data.scenarios, scenario],
      simulationResults: [...data.simulationResults, result],
      recommendations: [
        ...data.recommendations.filter(
          (item) => item.resultId !== result.id,
        ),
        ...recommendations,
      ],
    },
  }
}
