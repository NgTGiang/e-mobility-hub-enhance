import {
  ArrowRight,
  BatteryCharging,
  Bike,
  Building2,
  CheckCircle2,
  CircleParking,
  FlaskConical,
  Gauge,
  GitCompareArrows,
  Lightbulb,
  MapPin,
  RefreshCcw,
  Route,
  ShieldCheck,
  TriangleAlert,
  Zap,
} from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router"
import {
  CapacityBar,
  DataTable,
  OperatorMetric,
  OperatorNotice,
  OperatorPageHeader,
  getHubMetrics,
} from "@/components/operator/OperatorUI"
import { SelectField } from "@/components/student/StudentUI"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { TextInput } from "@/components/ui/TextInput"
import type { SimulationInput } from "@/services/simulationService"
import { useAppStore } from "@/store/appStore"
import type {
  HubSimulationComparison,
  SimulationRecommendation,
  SimulationScenario,
} from "@/types/domain"

const scenarioLabels: Record<SimulationScenario["type"], string> = {
  DEMAND_INCREASE: "Nhu cầu sinh viên tăng đột biến",
  PARKING_CAPACITY: "Mobility Hub đạt giới hạn chỗ đỗ",
  CHARGING_SURGE: "Nhu cầu sạc tăng cao",
  CHARGER_FAILURE: "Cổng sạc gặp sự cố",
  VEHICLE_CONCENTRATION: "Phương tiện tập trung quá mức",
}

const scenarioDescriptions: Record<SimulationScenario["type"], string> = {
  DEMAND_INCREASE:
    "Ước tính suy giảm số xe khả dụng khi nhu cầu chuyến đi tăng.",
  PARKING_CAPACITY:
    "Đánh giá thiếu hụt khi công suất đỗ hữu dụng bị giới hạn.",
  CHARGING_SURGE:
    "Mô phỏng hàng đợi và thiếu hụt khi số yêu cầu sạc tăng.",
  CHARGER_FAILURE:
    "Giảm số cổng sạc hữu dụng và đánh giá áp lực còn lại.",
  VEHICLE_CONCENTRATION:
    "Mô phỏng xe dồn về một Hub và tác động tới chỗ đỗ.",
}

function defaultInput(hubId: string): SimulationInput {
  return {
    type: "DEMAND_INCREASE",
    targetHubId: hubId,
    demandIncreasePercent: 75,
    disabledChargingPoints: 1,
    parkingCapacityLimit: 4,
    affectedVehicles: 2,
    durationHours: 4,
  }
}

export function SimulationConfigurationPage() {
  const { data, runSimulation } = useAppStore()
  const navigate = useNavigate()
  const [input, setInput] = useState<SimulationInput>(
    defaultInput(data.hubs[0]?.id ?? ""),
  )
  const [notice, setNotice] = useState<{
    ok: boolean
    message: string
  } | null>(null)
  const targetHub = data.hubs.find((item) => item.id === input.targetHubId)
  const hubMetrics = targetHub ? getHubMetrics(data, targetHub.id) : null
  const targetParkingCount = data.parkingSpaces.filter(
    (item) => item.hubId === input.targetHubId,
  ).length
  const targetChargingCount = data.chargingPoints.filter(
    (item) => item.hubId === input.targetHubId,
  ).length

  const update = <Key extends keyof SimulationInput>(
    key: Key,
    value: SimulationInput[Key],
  ) => setInput((current) => ({ ...current, [key]: value }))

  const reset = () => {
    setInput(defaultInput(data.hubs[0]?.id ?? ""))
    setNotice(null)
  }

  const run = () => {
    const result = runSimulation(input)
    setNotice(result)
    if (result.ok) navigate("/operator/simulation/results")
  }

  return (
    <div className="space-y-6">
      <OperatorPageHeader
        eyebrow="OP-14 • Dữ liệu mô phỏng"
        title="Thiết lập mô phỏng"
        description="Cấu hình kịch bản trên ảnh chụp trạng thái độc lập. Mô phỏng không thay đổi phương tiện, Hub, chỗ đỗ, cổng sạc hoặc lượt đặt vận hành."
      />
      <OperatorNotice tone="info">
        Đây là mô hình quy tắc xác định, không phải thuật toán tối ưu hóa AI.
        Cùng một snapshot và tham số sẽ tạo cùng kết quả tính toán.
      </OperatorNotice>
      {notice ? (
        <OperatorNotice tone={notice.ok ? "success" : "error"}>
          {notice.message}
        </OperatorNotice>
      ) : null}

      <Card>
        <CardHeader
          title="Chọn loại kịch bản"
          description="Mỗi loại áp dụng một quy tắc tác động minh bạch."
        />
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {(
            Object.keys(scenarioLabels) as SimulationScenario["type"][]
          ).map((type) => (
            <button
              key={type}
              onClick={() => update("type", type)}
              aria-pressed={input.type === type}
              className={`rounded-xl border p-4 text-left transition ${
                input.type === type
                  ? "border-info bg-blue-50 ring-4 ring-info/10"
                  : "border-line hover:bg-surface-muted"
              }`}
            >
              <span
                className={`grid size-10 place-items-center rounded-xl ${
                  input.type === type
                    ? "bg-info text-white"
                    : "bg-surface-muted text-ink-muted"
                }`}
              >
                {type === "CHARGER_FAILURE" ||
                type === "CHARGING_SURGE" ? (
                  <Zap className="size-5" />
                ) : type === "PARKING_CAPACITY" ? (
                  <CircleParking className="size-5" />
                ) : type === "VEHICLE_CONCENTRATION" ? (
                  <Bike className="size-5" />
                ) : (
                  <Gauge className="size-5" />
                )}
              </span>
              <h2 className="mt-3 text-sm font-semibold text-ink">
                {scenarioLabels[type]}
              </h2>
              <p className="mt-2 text-xs leading-5 text-ink-muted">
                {scenarioDescriptions[type]}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_.7fr]">
        <Card>
          <CardHeader
            title="Tham số kịch bản"
            description="Các trường không liên quan được ẩn để tránh cấu hình mâu thuẫn."
          />
          <CardContent className="space-y-5">
            <SelectField
              label="Mobility Hub mục tiêu"
              value={input.targetHubId}
              onChange={(event) => {
                const hubId = event.target.value
                const parkingCount = data.parkingSpaces.filter(
                  (item) => item.hubId === hubId,
                ).length
                update("targetHubId", hubId)
                update("parkingCapacityLimit", Math.max(1, parkingCount - 2))
              }}
            >
              {data.hubs.map((hub) => (
                <option value={hub.id} key={hub.id}>
                  {hub.name}
                </option>
              ))}
            </SelectField>
            {input.type === "DEMAND_INCREASE" ||
            input.type === "CHARGING_SURGE" ? (
              <TextInput
                label="Mức tăng nhu cầu (%)"
                type="number"
                min={1}
                max={200}
                value={input.demandIncreasePercent}
                onChange={(event) =>
                  update(
                    "demandIncreasePercent",
                    Number(event.target.value),
                  )
                }
              />
            ) : null}
            {input.type === "CHARGER_FAILURE" ? (
              <TextInput
                label={`Số cổng sạc ngừng hoạt động (tối đa ${targetChargingCount})`}
                type="number"
                min={1}
                max={targetChargingCount}
                value={input.disabledChargingPoints}
                onChange={(event) =>
                  update(
                    "disabledChargingPoints",
                    Number(event.target.value),
                  )
                }
              />
            ) : null}
            {input.type === "PARKING_CAPACITY" ? (
              <TextInput
                label={`Giới hạn công suất đỗ (tối đa ${targetParkingCount})`}
                type="number"
                min={1}
                max={targetParkingCount}
                value={input.parkingCapacityLimit}
                onChange={(event) =>
                  update(
                    "parkingCapacityLimit",
                    Number(event.target.value),
                  )
                }
              />
            ) : null}
            {input.type === "VEHICLE_CONCENTRATION" ? (
              <TextInput
                label="Số phương tiện dồn về Hub"
                type="number"
                min={1}
                value={input.affectedVehicles}
                onChange={(event) =>
                  update("affectedVehicles", Number(event.target.value))
                }
              />
            ) : null}
            <TextInput
              label="Thời gian đánh giá (giờ)"
              type="number"
              min={1}
              max={168}
              value={input.durationHours}
              onChange={(event) =>
                update("durationHours", Number(event.target.value))
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Trạng thái cơ sở"
            description="Các giá trị chỉ được đọc tại thời điểm chạy."
          />
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-ink">
                {targetHub?.name}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {targetHub?.location}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <SnapshotItem
                label="Xe khả dụng"
                value={hubMetrics?.availableVehicles ?? 0}
                icon={Bike}
              />
              <SnapshotItem
                label="Chỗ đỗ"
                value={hubMetrics?.availableParking ?? 0}
                icon={CircleParking}
              />
              <SnapshotItem
                label="Cổng sạc"
                value={hubMetrics?.availableCharging ?? 0}
                icon={BatteryCharging}
              />
            </div>
            <CapacityBar
              value={Math.min(targetHub?.utilization ?? 0, 100)}
              label="Mức sử dụng hiện tại"
            />
            <div className="rounded-xl bg-surface-muted p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <ShieldCheck className="size-4 text-brand" />
                Cách ly trạng thái
              </p>
              <p className="mt-2 text-xs leading-5 text-ink-muted">
                Ảnh chụp không giữ liên kết thay đổi tới tài nguyên vận hành.
                Kết quả chỉ được lưu trong vùng dữ liệu mô phỏng.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Button variant="secondary" icon={RefreshCcw} onClick={reset}>
          Đặt lại
        </Button>
        <Button icon={FlaskConical} onClick={run}>
          Chạy mô phỏng
        </Button>
      </div>
    </div>
  )
}

function SnapshotItem({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: typeof Bike
}) {
  return (
    <div className="rounded-xl bg-surface-muted p-3 text-center">
      <Icon className="mx-auto size-4 text-info" />
      <p className="mt-2 text-xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-[10px] text-ink-muted">{label}</p>
    </div>
  )
}

export function SimulationResultsPage() {
  const { data } = useAppStore()
  const result = data.simulationResults.at(-1)
  const scenario = data.scenarios.find(
    (item) => item.id === result?.scenarioId,
  )
  if (!result || !scenario) {
    return (
      <div className="space-y-6">
        <OperatorPageHeader
          eyebrow="OP-15"
          title="Kết quả mô phỏng"
            description="Chạy một kịch bản để tạo trạng thái cơ sở và trạng thái mô phỏng."
        />
        <Card className="grid min-h-96 place-items-center p-8 text-center">
          <div>
            <FlaskConical className="mx-auto size-12 text-ink-muted" />
            <h2 className="mt-4 text-xl font-semibold text-ink">
              Chưa có kết quả mô phỏng
            </h2>
            <p className="mt-2 text-ink-muted">
              Thiết lập tham số và chạy mô phỏng trước khi xem phân tích.
            </p>
            <Link
              className="button-primary mt-6"
              to="/operator/simulation/new"
            >
              Thiết lập mô phỏng
            </Link>
          </div>
        </Card>
      </div>
    )
  }
  const targetHub = data.hubs.find(
    (item) => item.id === scenario.targetHubId,
  )
  const target = result.hubComparisons.find(
    (item) => item.hubId === scenario.targetHubId,
  )!

  return (
    <div className="space-y-6">
      <OperatorPageHeader
        eyebrow="OP-15 • Kết quả mô phỏng"
        title="Kết quả mô phỏng"
        description={`${scenario.name} • ${targetHub?.name} • ${scenario.durationHours} giờ`}
        action={
          <div className="flex gap-2">
            <Link
              className="button-secondary"
              to="/operator/simulation/new"
            >
              Chạy kịch bản khác
            </Link>
            <Link
              className="button-primary"
              to="/operator/simulation/recommendations"
            >
              Xem đề xuất
            </Link>
          </div>
        }
      />
      <OperatorNotice tone="warning">
        Toàn bộ số liệu bên dưới là kết quả mô phỏng. Trạng thái vận hành trực
        tiếp không bị thay đổi.
      </OperatorNotice>
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ScenarioSummary label="Kịch bản" value={scenarioLabels[scenario.type]} />
          <ScenarioSummary label="Hub mục tiêu" value={targetHub?.name ?? "Không xác định"} />
          <ScenarioSummary label="Thời gian đánh giá" value={`${scenario.durationHours} giờ`} />
          <ScenarioSummary
            label="Tham số tác động"
            value={
              scenario.type === "DEMAND_INCREASE" ||
              scenario.type === "CHARGING_SURGE"
                ? `Tăng ${scenario.demandIncreasePercent}%`
                : scenario.type === "CHARGER_FAILURE"
                  ? `${scenario.disabledChargingPoints} cổng sạc ngừng hoạt động`
                  : scenario.type === "PARKING_CAPACITY"
                    ? `Giới hạn ${scenario.parkingCapacityLimit} chỗ đỗ`
                    : `${scenario.affectedVehicles} xe bị ảnh hưởng`
            }
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BeforeAfterMetric
          icon={Bike}
          label="Xe khả dụng"
          before={result.baseline.availableVehicles}
          after={result.simulated.availableVehicles}
        />
        <BeforeAfterMetric
          icon={CircleParking}
          label="Chỗ đỗ khả dụng"
          before={result.baseline.availableParking}
          after={result.simulated.availableParking}
        />
        <BeforeAfterMetric
          icon={BatteryCharging}
          label="Cổng sạc khả dụng"
          before={result.baseline.availableCharging}
          after={result.simulated.availableCharging}
        />
        <BeforeAfterMetric
          icon={TriangleAlert}
          label="Hub vượt ngưỡng"
          before={result.baseline.overloadedHubs}
          after={result.simulated.overloadedHubs}
          inverse
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
        <Card>
          <CardHeader
            title="So sánh trạng thái cơ sở và mô phỏng"
            description="Chiều dài thanh được chuẩn hóa theo từng chỉ số."
          />
          <CardContent className="space-y-6">
            <ComparisonBar
              label="Mức sử dụng trung bình"
              before={result.baseline.averageUtilization}
              after={result.simulated.averageUtilization}
              suffix="%"
              max={100}
            />
            <ComparisonBar
              label="Xe khả dụng"
              before={result.baseline.availableVehicles}
              after={result.simulated.availableVehicles}
              max={Math.max(
                result.baseline.availableVehicles,
                result.simulated.availableVehicles,
                1,
              )}
            />
            <ComparisonBar
              label="Chỗ đỗ khả dụng"
              before={result.baseline.availableParking}
              after={result.simulated.availableParking}
              max={Math.max(
                result.baseline.availableParking,
                result.simulated.availableParking,
                1,
              )}
            />
            <ComparisonBar
              label="Cổng sạc khả dụng"
              before={result.baseline.availableCharging}
              after={result.simulated.availableCharging}
              max={Math.max(
                result.baseline.availableCharging,
                result.simulated.availableCharging,
                1,
              )}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader
            title="Nút thắt và tác động dịch vụ"
            description="Được tạo từ các ngưỡng và thiếu hụt tính toán."
          />
          <CardContent className="space-y-3">
            {result.bottlenecks.map((item) => (
              <div
                className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
                key={item}
              >
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                <p className="text-sm font-medium text-amber-900">{item}</p>
              </div>
            ))}
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-info">
                Tác động dịch vụ
              </p>
              <p className="mt-2 text-sm leading-6 text-blue-900">
                {result.serviceImpact}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="So sánh bản đồ mạng lưới"
          description="Màu đỏ biểu thị Hub đạt hoặc vượt ngưỡng 85%."
        />
        <CardContent className="grid gap-5 lg:grid-cols-2">
          <SimulationMap
            title="Trạng thái vận hành cơ sở"
            comparisons={result.hubComparisons}
            simulated={false}
            hubs={data.hubs}
          />
          <SimulationMap
            title="Trạng thái mô phỏng"
            comparisons={result.hubComparisons}
            simulated
            hubs={data.hubs}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Kết quả chi tiết theo Mobility Hub"
          description={`Hub mục tiêu: ${targetHub?.name} • Mức sử dụng ${target.baselineUtilization}% → ${target.simulatedUtilization}%`}
        />
        <CardContent className="!p-0">
          <DataTable minWidth="min-w-[1050px]">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wider text-ink-muted">
                <th className="px-4 py-3">Mobility Hub</th>
                <th className="px-4 py-3">Mức sử dụng</th>
                <th className="px-4 py-3">Xe khả dụng</th>
                <th className="px-4 py-3">Chỗ đỗ</th>
                <th className="px-4 py-3">Cổng sạc</th>
                <th className="px-4 py-3">Thiếu hụt</th>
              </tr>
            </thead>
            <tbody>
              {result.hubComparisons.map((item) => (
                <tr
                  className={`border-b border-line last:border-0 ${
                    item.hubId === scenario.targetHubId ? "bg-blue-50/50" : ""
                  }`}
                  key={item.hubId}
                >
                  <td className="px-4 py-4 font-semibold text-ink">
                    {data.hubs.find((hub) => hub.id === item.hubId)?.name}
                  </td>
                  <td className="px-4 py-4 text-sm text-ink">
                    {item.baselineUtilization}% →{" "}
                    <strong>{item.simulatedUtilization}%</strong>
                  </td>
                  <td className="px-4 py-4 text-sm text-ink">
                    {item.baselineVehicles} → {item.simulatedVehicles}
                  </td>
                  <td className="px-4 py-4 text-sm text-ink">
                    {item.baselineParking} → {item.simulatedParking}
                  </td>
                  <td className="px-4 py-4 text-sm text-ink">
                    {item.baselineCharging} → {item.simulatedCharging}
                  </td>
                  <td className="px-4 py-4">
                    {item.vehicleShortage +
                      item.parkingShortage +
                      item.chargingShortage ? (
                      <Badge tone="danger">
                        {item.vehicleShortage +
                          item.parkingShortage +
                          item.chargingShortage}{" "}
                        tài nguyên
                      </Badge>
                    ) : (
                      <Badge tone="success">Không thiếu hụt</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  )
}

function BeforeAfterMetric({
  icon,
  label,
  before,
  after,
  inverse = false,
}: {
  icon: typeof Bike
  label: string
  before: number
  after: number
  inverse?: boolean
}) {
  const difference = after - before
  const favorable = inverse ? difference <= 0 : difference >= 0
  const percentDifference =
    before > 0 ? Math.round((difference / before) * 100) : null
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-info">
          {(() => {
            const Icon = icon
            return <Icon className="size-5" />
          })()}
        </span>
        <Badge tone={difference === 0 ? "neutral" : favorable ? "success" : "danger"}>
          {difference > 0 ? "+" : ""}
          {difference}
          {percentDifference !== null
            ? ` (${percentDifference > 0 ? "+" : ""}${percentDifference}%)`
            : ""}
        </Badge>
      </div>
      <p className="mt-4 text-sm text-ink-muted">{label}</p>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-lg font-semibold text-ink-muted">{before}</span>
        <ArrowRight className="mb-1 size-4 text-ink-muted" />
        <span className="text-3xl font-bold text-ink">{after}</span>
      </div>
    </Card>
  )
}

function ScenarioSummary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-ink">{value}</p>
    </div>
  )
}

function ComparisonBar({
  label,
  before,
  after,
  max,
  suffix = "",
}: {
  label: string
  before: number
  after: number
  max: number
  suffix?: string
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-ink">{label}</p>
      <div className="grid grid-cols-[5rem_1fr_3rem] items-center gap-3">
        <span className="text-xs text-ink-muted">Cơ sở</span>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-400"
            style={{ width: `${Math.min(100, (before / max) * 100)}%` }}
          />
        </div>
        <span className="text-right text-xs font-bold text-ink">
          {before}{suffix}
        </span>
        <span className="text-xs text-info">Mô phỏng</span>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${after > before ? "bg-warning" : "bg-info"}`}
            style={{ width: `${Math.min(100, (after / max) * 100)}%` }}
          />
        </div>
        <span className="text-right text-xs font-bold text-ink">
          {after}{suffix}
        </span>
      </div>
    </div>
  )
}

function SimulationMap({
  title,
  comparisons,
  simulated,
  hubs,
}: {
  title: string
  comparisons: HubSimulationComparison[]
  simulated: boolean
  hubs: ReturnType<typeof useAppStore>["data"]["hubs"]
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-ink">{title}</h3>
        <Badge tone={simulated ? "warning" : "neutral"}>
          {simulated ? "Mô phỏng" : "Cơ sở"}
        </Badge>
      </div>
      <div className="relative min-h-72 overflow-hidden rounded-2xl bg-slate-100">
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]" />
        {comparisons.map((item, index) => {
          const utilization = simulated
            ? item.simulatedUtilization
            : item.baselineUtilization
          return (
            <div
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-center"
              style={{
                left: `${18 + (index % 3) * 32}%`,
                top: `${25 + Math.floor(index / 3) * 48}%`,
              }}
              key={item.hubId}
            >
              <span
                className={`mx-auto grid size-9 place-items-center rounded-full text-white shadow-md ${
                  utilization >= 85
                    ? "bg-danger"
                    : utilization >= 70
                      ? "bg-warning"
                      : "bg-brand"
                }`}
              >
                <MapPin className="size-4" />
              </span>
              <p className="mt-1 max-w-24 text-[10px] font-semibold text-ink">
                {hubs.find((hub) => hub.id === item.hubId)?.name.replace(
                  "Mobility Hub ",
                  "",
                )}
              </p>
              <p className="text-[10px] font-bold text-ink-muted">
                {utilization}%
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SimulationRecommendationsPage() {
  const { data } = useAppStore()
  const result = data.simulationResults.at(-1)
  const scenario = data.scenarios.find(
    (item) => item.id === result?.scenarioId,
  )
  const recommendations = data.recommendations.filter(
    (item) => item.resultId === result?.id,
  )
  if (!result || !scenario) {
    return (
      <div className="space-y-6">
        <OperatorPageHeader
          eyebrow="OP-16"
          title="Đề xuất điều phối"
          description="Chưa có kết quả để tạo đề xuất."
        />
        <OperatorNotice tone="warning">
          Hãy chạy mô phỏng trước khi xem đề xuất.
        </OperatorNotice>
        <Link className="button-primary" to="/operator/simulation/new">
          Thiết lập mô phỏng
        </Link>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <OperatorPageHeader
        eyebrow="OP-16 • Đề xuất theo quy tắc"
        title="Đề xuất điều phối"
        description={`${scenario.name} • ${recommendations.length} phương án được tạo từ các ngưỡng mô phỏng`}
        action={
          <Link
            className="button-secondary"
            to="/operator/simulation/results"
          >
            Xem lại kết quả
          </Link>
        }
      />
      <OperatorNotice tone="info">
        Đề xuất không trực tiếp thay đổi tài nguyên. Mọi thao tác thực tế phải
        chuyển sang quy trình vận hành riêng và được xác nhận lại.
      </OperatorNotice>

      <div className="grid gap-4 sm:grid-cols-3">
        <OperatorMetric
          icon={Lightbulb}
          label="Tổng đề xuất"
          value={recommendations.length}
          helper="Được tạo theo quy tắc"
          tone="blue"
        />
        <OperatorMetric
          icon={TriangleAlert}
          label="Ưu tiên cao"
          value={recommendations.filter((item) => item.priority === "HIGH").length}
          helper="Cần đánh giá trước"
          tone="red"
        />
        <OperatorMetric
          icon={ShieldCheck}
          label="Đã thực thi"
          value={0}
          helper="Mô phỏng không tự thực thi"
        />
      </div>

      <div className="space-y-5">
        {recommendations.map((recommendation, index) => (
          <RecommendationCard
            recommendation={recommendation}
            index={index}
            key={recommendation.id}
          />
        ))}
      </div>

      <Card>
        <CardHeader
          title="So sánh phương án"
          description="Đánh giá nhanh tác động và ràng buộc trước khi chuyển sang vận hành."
        />
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.map((item) => (
            <div className="rounded-xl border border-line p-4" key={item.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-ink">{item.id}</p>
                <PriorityBadge priority={item.priority} />
              </div>
              <p className="mt-3 text-sm font-medium text-ink">
                {categoryLabels[item.category]}
              </p>
              <p className="mt-2 text-xs leading-5 text-ink-muted">
                {item.expectedImpact}
              </p>
              <p className="mt-3 text-xs font-semibold text-info">
                {item.affectedResourceIds.length} tài nguyên liên quan
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

const categoryLabels: Record<
  SimulationRecommendation["category"],
  string
> = {
  VEHICLE_REDISTRIBUTION: "Điều phối lại phương tiện",
  CHARGING_ADJUSTMENT: "Điều chỉnh lịch sạc",
  ALTERNATIVE_HUB: "Đề xuất Hub thay thế",
  RESOURCE_REALLOCATION: "Phân bổ lại tài nguyên",
}

function RecommendationCard({
  recommendation,
  index,
}: {
  recommendation: SimulationRecommendation
  index: number
}) {
  const operationalLink =
    recommendation.category === "VEHICLE_REDISTRIBUTION" &&
    recommendation.sourceHubId &&
    recommendation.destinationHubId
      ? `/operator/redistribution?source=${recommendation.sourceHubId}&destination=${recommendation.destinationHubId}`
      : recommendation.category === "CHARGING_ADJUSTMENT"
        ? "/operator/charging-schedule"
        : recommendation.destinationHubId
          ? `/operator/hubs/${recommendation.destinationHubId}`
          : "/operator/resources"
  const actionLabel =
    recommendation.category === "VEHICLE_REDISTRIBUTION"
      ? "Chuyển sang điều phối"
      : recommendation.category === "CHARGING_ADJUSTMENT"
        ? "Mở lịch sạc"
        : "Xem tài nguyên"
  return (
    <Card>
      <CardContent className="grid gap-6 xl:grid-cols-[auto_1fr_auto] xl:items-start">
        <span className="grid size-12 place-items-center rounded-xl bg-blue-50 text-lg font-bold text-info">
          {index + 1}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-ink">
              {categoryLabels[recommendation.category]}
            </h2>
            <PriorityBadge priority={recommendation.priority} />
            <Badge tone="info">Đề xuất mô phỏng</Badge>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Vấn đề
              </p>
              <p className="mt-2 text-sm leading-6 text-ink">
                {recommendation.problem}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Hành động đề xuất
              </p>
              <p className="mt-2 text-sm leading-6 text-ink">
                {recommendation.proposedAction}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Tác động kỳ vọng
              </p>
              <p className="mt-2 text-sm leading-6 text-brand-strong">
                {recommendation.expectedImpact}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Ràng buộc
              </p>
              <ul className="mt-2 space-y-1">
                {recommendation.constraints.map((constraint) => (
                  <li
                    className="flex items-start gap-2 text-sm text-ink-muted"
                    key={constraint}
                  >
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" />
                    {constraint}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {recommendation.affectedResourceIds.map((id) => (
              <span
                className="rounded-lg bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink-muted"
                key={id}
              >
                {id}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            className="button-secondary"
            to="/operator/simulation/results"
          >
            Xem chi tiết
          </Link>
          <Link className="button-primary" to={operationalLink}>
            {actionLabel} <ArrowRight className="size-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function PriorityBadge({
  priority,
}: {
  priority: SimulationRecommendation["priority"]
}) {
  return (
    <Badge
      tone={
        priority === "HIGH"
          ? "danger"
          : priority === "MEDIUM"
            ? "warning"
            : "neutral"
      }
    >
      {priority === "HIGH"
        ? "Ưu tiên cao"
        : priority === "MEDIUM"
          ? "Ưu tiên vừa"
          : "Ưu tiên thấp"}
    </Badge>
  )
}
