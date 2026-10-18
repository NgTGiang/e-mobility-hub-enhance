import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react"
import { createInitialState } from "@/data/mockData"
import {
  cancelChargingRequest,
  cancelParkingReservation,
  cancelVehicleReservation,
  pickupVehicle,
  registerCharging,
  reserveParking,
  reserveVehicle,
  returnVehicle,
  type ChargingRequestInput,
  type DomainResult,
  type ParkingReservationInput,
} from "@/services/studentService"
import type { AppState, User, UserRole } from "@/types/domain"
import {
  assignChargingRequest,
  dispatchVehicles,
  resolveIncident,
  startIncidentHandling,
  type DispatchInput,
} from "@/services/operatorService"
import {
  runSimulation,
  type SimulationInput,
} from "@/services/simulationService"

interface StoreState {
  data: AppState
  currentUser: User | null
}

type Action =
  | {
      type: "LOGIN_AS"
      role: UserRole
    }
  | { type: "LOGOUT" }
  | { type: "RESET_DEMO_DATA" }
  | { type: "MARK_NOTIFICATIONS_READ"; userId: string; role: UserRole }
  | { type: "SET_DATA"; data: AppState }

const initialData = createInitialState()
const initialState: StoreState = { data: initialData, currentUser: null }

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "LOGIN_AS":
      return {
        ...state,
        currentUser:
          state.data.users.find((user) => user.role === action.role) ?? null,
      }
    case "LOGOUT":
      return { ...state, currentUser: null }
    case "RESET_DEMO_DATA":
      return { data: createInitialState(), currentUser: state.currentUser }
    case "MARK_NOTIFICATIONS_READ":
      return {
        ...state,
        data: {
          ...state.data,
          notifications: state.data.notifications.map((item) =>
            item.userId === action.userId || item.role === action.role
              ? { ...item, read: true }
              : item,
          ),
        },
      }
    case "SET_DATA":
      return { ...state, data: action.data }
  }
}

interface AppStoreValue extends StoreState {
  loginAs: (role: UserRole) => void
  logout: () => void
  resetDemoData: () => void
  markNotificationsRead: () => void
  reserveVehicle: (vehicleId: string) => DomainResult
  pickupVehicle: (reservationId: string) => DomainResult
  cancelVehicleReservation: (reservationId: string) => DomainResult
  returnVehicle: (destinationHubId: string) => DomainResult
  reserveParking: (input: ParkingReservationInput) => DomainResult
  cancelParkingReservation: (reservationId: string) => DomainResult
  registerCharging: (input: ChargingRequestInput) => DomainResult
  cancelChargingRequest: (requestId: string) => DomainResult
  dispatchVehicles: (input: DispatchInput) => DomainResult
  assignChargingRequest: (
    requestId: string,
    chargingPointId: string,
  ) => DomainResult
  startIncidentHandling: (incidentId: string) => DomainResult
  resolveIncident: (incidentId: string, notes: string) => DomainResult
  runSimulation: (input: SimulationInput) => DomainResult
  metrics: {
    availableVehicles: number
    inUseVehicles: number
    availableParking: number
    availableCharging: number
    openIncidents: number
    unreadNotifications: number
  }
}

const AppStoreContext = createContext<AppStoreValue | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const applyMutation = (
    mutation: {
      ok: boolean
      message: string
      data?: AppState
    },
  ): DomainResult => {
    if (mutation.ok && mutation.data) {
      dispatch({ type: "SET_DATA", data: mutation.data })
    }
    return { ok: mutation.ok, message: mutation.message }
  }
  const metrics = useMemo(
    () => ({
      availableVehicles: state.data.vehicles.filter(
        (item) =>
          item.usageStatus === "AVAILABLE" &&
          item.technicalCondition !== "MAJOR_DAMAGE",
      ).length,
      inUseVehicles: state.data.vehicles.filter(
        (item) => item.usageStatus === "IN_USE",
      ).length,
      availableParking: state.data.parkingSpaces.filter(
        (item) => item.status === "AVAILABLE",
      ).length,
      availableCharging: state.data.chargingPoints.filter(
        (item) => item.status === "AVAILABLE",
      ).length,
      openIncidents: state.data.incidents.filter(
        (item) => item.status !== "RESOLVED",
      ).length,
      unreadNotifications: state.data.notifications.filter(
        (item) =>
          !item.read &&
          (item.userId === state.currentUser?.id ||
            item.role === state.currentUser?.role),
      ).length,
    }),
    [state],
  )

  const value: AppStoreValue = {
    ...state,
    metrics,
    loginAs: (role) => dispatch({ type: "LOGIN_AS", role }),
    logout: () => dispatch({ type: "LOGOUT" }),
    resetDemoData: () => dispatch({ type: "RESET_DEMO_DATA" }),
    markNotificationsRead: () => {
      if (state.currentUser) {
        dispatch({
          type: "MARK_NOTIFICATIONS_READ",
          userId: state.currentUser.id,
          role: state.currentUser.role,
        })
      }
    },
    reserveVehicle: (vehicleId) =>
      applyMutation(reserveVehicle(state.data, state.currentUser, vehicleId)),
    pickupVehicle: (reservationId) =>
      applyMutation(pickupVehicle(state.data, state.currentUser, reservationId)),
    cancelVehicleReservation: (reservationId) =>
      applyMutation(
        cancelVehicleReservation(state.data, state.currentUser, reservationId),
      ),
    returnVehicle: (destinationHubId) =>
      applyMutation(
        returnVehicle(state.data, state.currentUser, destinationHubId),
      ),
    reserveParking: (input) =>
      applyMutation(reserveParking(state.data, state.currentUser, input)),
    cancelParkingReservation: (reservationId) =>
      applyMutation(
        cancelParkingReservation(state.data, state.currentUser, reservationId),
      ),
    registerCharging: (input) =>
      applyMutation(registerCharging(state.data, state.currentUser, input)),
    cancelChargingRequest: (requestId) =>
      applyMutation(
        cancelChargingRequest(state.data, state.currentUser, requestId),
      ),
    dispatchVehicles: (input) =>
      applyMutation(dispatchVehicles(state.data, state.currentUser, input)),
    assignChargingRequest: (requestId, chargingPointId) =>
      applyMutation(
        assignChargingRequest(
          state.data,
          state.currentUser,
          requestId,
          chargingPointId,
        ),
      ),
    startIncidentHandling: (incidentId) =>
      applyMutation(
        startIncidentHandling(state.data, state.currentUser, incidentId),
      ),
    resolveIncident: (incidentId, notes) =>
      applyMutation(
        resolveIncident(state.data, state.currentUser, incidentId, notes),
      ),
    runSimulation: (input) =>
      applyMutation(runSimulation(state.data, state.currentUser, input)),
  }

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  )
}

export function useAppStore() {
  const context = useContext(AppStoreContext)
  if (!context)
    throw new Error("useAppStore must be used within AppStoreProvider")
  return context
}
