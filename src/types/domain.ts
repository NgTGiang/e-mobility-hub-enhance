export type UserRole = "STUDENT" | "OPERATOR"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  affiliation: string
}

export type OperationalStatus = "OPERATIONAL" | "LIMITED" | "UNAVAILABLE"
export type VehicleType = "ELECTRIC_BICYCLE" | "ELECTRIC_MOTORCYCLE" | "ELECTRIC_CAR"
export type TechnicalCondition = "GOOD" | "MINOR_DAMAGE" | "MAJOR_DAMAGE"
export type VehicleUsageStatus = "AVAILABLE" | "RESERVED" | "IN_USE"
export type ParkingStatus = "AVAILABLE" | "RESERVED" | "OCCUPIED" | "UNAVAILABLE"
export type ChargingPointStatus = "AVAILABLE" | "RESERVED" | "CHARGING" | "UNAVAILABLE"

export interface MobilityHub {
  id: string
  name: string
  location: string
  operationalStatus: OperationalStatus
  totalParkingCapacity: number
  vehicleIds: string[]
  parkingSpaceIds: string[]
  chargingPointIds: string[]
  utilization: number
  lastUpdated: string
}

export interface Vehicle {
  id: string
  type: VehicleType
  batteryLevel: number
  technicalCondition: TechnicalCondition
  usageStatus: VehicleUsageStatus
  currentHubId: string
  odometer: number
  licensePlate?: string
  lastUpdated: string
}

export interface ParkingSpace {
  id: string
  hubId: string
  status: ParkingStatus
  compatibleVehicleTypes: VehicleType[]
  currentReservationId?: string
}

export interface ChargingPoint {
  id: string
  hubId: string
  status: ChargingPointStatus
  compatibleVehicleTypes: VehicleType[]
  assignedSessionId?: string
  technicalCondition: TechnicalCondition
}

export type ReservationStatus = "PENDING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED"
export type ChargingRequestStatus = "ACCEPTED" | "PENDING" | "SCHEDULED" | "CHARGING" | "COMPLETED" | "CANCELLED"

export interface TimeInterval {
  start: string
  end: string
}

interface ReservationBase {
  id: string
  userId: string
  status: ReservationStatus
  requestedTime: TimeInterval
  createdAt: string
  updatedAt: string
}

export interface VehicleReservation extends ReservationBase {
  resourceId: string
  pickupHubId: string
}

export interface ParkingReservation extends ReservationBase {
  resourceId: string
  vehicleId: string
  hubId: string
}

export interface ChargingRequest {
  id: string
  userId: string
  resourceId?: string
  vehicleId: string
  hubId: string
  status: ChargingRequestStatus
  requestedTime: TimeInterval
  assignedTime?: TimeInterval
  createdAt: string
  updatedAt: string
}

export type Severity = "NORMAL" | "WARNING" | "CRITICAL"
export type IncidentStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED"
export type ResourceKind = "VEHICLE" | "PARKING_SPACE" | "CHARGING_POINT" | "HUB"

export interface Incident {
  id: string
  type: "VEHICLE_MALFUNCTION" | "CHARGING_POINT_FAILURE" | "PARKING_RESOURCE_FAILURE" | "HUB_OPERATIONAL_PROBLEM"
  resourceId: string
  resourceKind: ResourceKind
  hubId: string
  severity: Severity
  status: IncidentStatus
  description: string
  detectedAt: string
  resolutionNotes?: string
}

export interface DispatchOperation {
  id: string
  sourceHubId: string
  destinationHubId: string
  vehicleIds: string[]
  status: "PLANNED" | "COMPLETED" | "FAILED"
  createdAt: string
  completedAt?: string
}

export interface OperationalAlert {
  id: string
  hubId: string
  severity: Severity
  type: "CAPACITY" | "CHARGING_PRESSURE" | "VEHICLE_IMBALANCE" | "INCIDENT"
  message: string
  detectedAt: string
  acknowledged: boolean
}

export interface SimulationScenario {
  id: string
  name: string
  type: "DEMAND_INCREASE" | "PARKING_CAPACITY" | "CHARGING_SURGE" | "CHARGER_FAILURE" | "VEHICLE_CONCENTRATION"
  targetHubId: string
  demandIncreasePercent: number
  disabledChargingPoints: number
  parkingCapacityLimit: number
  affectedVehicles: number
  durationHours: number
  createdAt?: string
}

export interface SimulationNetworkMetrics {
  availableVehicles: number
  availableParking: number
  availableCharging: number
  averageUtilization: number
  overloadedHubs: number
  serviceCapacity: number
}

export interface HubSimulationComparison {
  hubId: string
  baselineUtilization: number
  simulatedUtilization: number
  baselineVehicles: number
  simulatedVehicles: number
  baselineParking: number
  simulatedParking: number
  baselineCharging: number
  simulatedCharging: number
  vehicleShortage: number
  parkingShortage: number
  chargingShortage: number
}

export interface SimulationResult {
  id: string
  scenarioId: string
  baselineUtilization: number
  simulatedUtilization: number
  vehicleShortage: number
  parkingShortage: number
  chargingShortage: number
  baseline: SimulationNetworkMetrics
  simulated: SimulationNetworkMetrics
  hubComparisons: HubSimulationComparison[]
  bottlenecks: string[]
  serviceImpact: string
  createdAt: string
}

export interface SimulationRecommendation {
  id: string
  resultId: string
  problem: string
  proposedAction: string
  affectedResourceIds: string[]
  expectedImpact: string
  constraints: string[]
  category:
    | "VEHICLE_REDISTRIBUTION"
    | "CHARGING_ADJUSTMENT"
    | "ALTERNATIVE_HUB"
    | "RESOURCE_REALLOCATION"
  priority: "HIGH" | "MEDIUM" | "LOW"
  sourceHubId?: string
  destinationHubId?: string
  status: "PROPOSED" | "REVIEWED" | "DISMISSED"
}

export interface Notification {
  id: string
  userId?: string
  role?: UserRole
  title: string
  message: string
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR"
  read: boolean
  createdAt: string
}

export interface AppState {
  users: User[]
  hubs: MobilityHub[]
  vehicles: Vehicle[]
  parkingSpaces: ParkingSpace[]
  chargingPoints: ChargingPoint[]
  vehicleReservations: VehicleReservation[]
  parkingReservations: ParkingReservation[]
  chargingRequests: ChargingRequest[]
  incidents: Incident[]
  dispatchOperations: DispatchOperation[]
  alerts: OperationalAlert[]
  scenarios: SimulationScenario[]
  simulationResults: SimulationResult[]
  recommendations: SimulationRecommendation[]
  notifications: Notification[]
}
