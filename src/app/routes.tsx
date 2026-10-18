import { createBrowserRouter, Navigate } from "react-router"
import { AuthGuard, RoleGuard } from "@/components/RoleGuard"
import { OperatorLayout } from "@/layouts/OperatorLayout"
import { StudentLayout } from "@/layouts/StudentLayout"
import { OperatorDashboard } from "@/pages/operator/OperatorDashboard"
import {
  NetworkMonitoringPage,
  OperatorHubDetailsPage,
  OperatorVehicleDetailsPage,
  VehicleMonitoringPage,
} from "@/pages/operator/MonitoringPages"
import {
  ChargingPointMonitoringPage,
  ChargingSchedulePage,
  ParkingMonitoringPage,
  ResourceAllocationPage,
} from "@/pages/operator/ResourcePages"
import {
  CapacityAlertsPage,
  IncidentDetailsPage,
  IncidentManagementPage,
  VehicleDispatchingPage,
} from "@/pages/operator/OperationsPages"
import {
  SimulationConfigurationPage,
  SimulationRecommendationsPage,
  SimulationResultsPage,
} from "@/pages/operator/SimulationPages"
import { LandingPage } from "@/pages/shared/LandingPage"
import { LoginPage } from "@/pages/shared/LoginPage"
import {
  AuthRedirectPage,
  ErrorPage,
  NotificationsPage,
  ProfilePage,
} from "@/pages/shared/SharedPages"
import { StudentDashboard } from "@/pages/student/StudentDashboard"
import {
  ActiveTripPage,
  MyVehicleBookingPage,
  VehicleDetailsPage,
  VehicleReservationPage,
  VehicleReturnPage,
  VehicleSearchPage,
} from "@/pages/student/VehiclePages"
import {
  HubDetailsPage,
  HubExplorerPage,
  MyParkingReservationsPage,
  ParkingAvailabilityPage,
  ParkingReservationPage,
} from "@/pages/student/HubParkingPages"
import {
  ChargingAvailabilityPage,
  ChargingRegistrationPage,
  MyChargingSchedulePage,
} from "@/pages/student/ChargingPages"

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/login", Component: LoginPage },
  { path: "/auth/redirect", Component: AuthRedirectPage },
  {
    path: "/profile",
    element: (
      <AuthGuard>
        <ProfilePage />
      </AuthGuard>
    ),
  },
  {
    path: "/notifications",
    element: (
      <AuthGuard>
        <NotificationsPage />
      </AuthGuard>
    ),
  },
  {
    path: "/student",
    element: (
      <RoleGuard role="STUDENT">
        <StudentLayout />
      </RoleGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/student/dashboard" replace /> },
      { path: "dashboard", Component: StudentDashboard },
      { path: "vehicles", Component: VehicleSearchPage },
      { path: "vehicles/:id", Component: VehicleDetailsPage },
      { path: "vehicles/:id/reserve", Component: VehicleReservationPage },
      { path: "my-booking", Component: MyVehicleBookingPage },
      { path: "active-trip", Component: ActiveTripPage },
      { path: "return-vehicle", Component: VehicleReturnPage },
      { path: "hubs", Component: HubExplorerPage },
      { path: "hubs/:id", Component: HubDetailsPage },
      { path: "parking", Component: ParkingAvailabilityPage },
      { path: "parking/reserve", Component: ParkingReservationPage },
      {
        path: "parking/my-reservations",
        Component: MyParkingReservationsPage,
      },
      { path: "charging", Component: ChargingAvailabilityPage },
      { path: "charging/register", Component: ChargingRegistrationPage },
      { path: "charging/my-requests", Component: MyChargingSchedulePage },
    ],
  },
  {
    path: "/operator",
    element: (
      <RoleGuard role="OPERATOR">
        <OperatorLayout />
      </RoleGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/operator/dashboard" replace /> },
      { path: "dashboard", Component: OperatorDashboard },
      { path: "network", Component: NetworkMonitoringPage },
      { path: "hubs/:id", Component: OperatorHubDetailsPage },
      { path: "vehicles", Component: VehicleMonitoringPage },
      { path: "vehicles/:id", Component: OperatorVehicleDetailsPage },
      { path: "parking", Component: ParkingMonitoringPage },
      { path: "charging-points", Component: ChargingPointMonitoringPage },
      { path: "charging-schedule", Component: ChargingSchedulePage },
      { path: "overload-alerts", Component: CapacityAlertsPage },
      { path: "redistribution", Component: VehicleDispatchingPage },
      { path: "resources", Component: ResourceAllocationPage },
      { path: "incidents", Component: IncidentManagementPage },
      { path: "incidents/:id", Component: IncidentDetailsPage },
      { path: "simulation/new", Component: SimulationConfigurationPage },
      { path: "simulation/results", Component: SimulationResultsPage },
      {
        path: "simulation/recommendations",
        Component: SimulationRecommendationsPage,
      },
    ],
  },
  { path: "/403", element: <ErrorPage code="403" /> },
  { path: "/error", element: <ErrorPage code="error" /> },
  { path: "/404", element: <ErrorPage code="404" /> },
  { path: "*", element: <ErrorPage code="404" /> },
])
