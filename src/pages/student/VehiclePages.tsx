import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  CircleParking,
  CloudRain,
  Filter,
  Gauge,
  List,
  Map,
  MapPin,
  Navigation,
  Route,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react"
import { useMemo, useState } from "react"
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router"
import {
  BatteryIndicator,
  EmptyState,
  Notice,
  PageHeader,
  SelectField,
  VehicleCard,
  VehicleVisual,
  hubStatusLabels,
  technicalLabels,
  vehicleStatusLabels,
  vehicleTypeLabels,
} from "@/components/student/StudentUI"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { TextInput } from "@/components/ui/TextInput"
import { useAppStore } from "@/store/appStore"
import type { Vehicle, VehicleType } from "@/types/domain"

function recommendationFor(
  vehicle: Vehicle,
  distance: number,
  passengers: number,
  rainy: boolean,
) {
  if (rainy && vehicle.type === "ELECTRIC_CAR") return "Phù hợp khi trời mưa"
  if (passengers > 2 && vehicle.type === "ELECTRIC_CAR") return "Phù hợp nhóm trên 2 người"
  if (distance <= 4 && vehicle.type === "ELECTRIC_BICYCLE") return "Tối ưu cho quãng đường ngắn"
  if (
    distance > 4 &&
    passengers <= 2 &&
    vehicle.type === "ELECTRIC_MOTORCYCLE"
  ) {
    return "Phù hợp quãng đường và số người"
  }
  return undefined
}

export function VehicleSearchPage() {
  const { data } = useAppStore()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  const [hubId, setHubId] = useState(searchParams.get("hub") ?? "ALL")
  const [type, setType] = useState<VehicleType | "ALL">("ALL")
  const [status, setStatus] = useState<"ALL" | "AVAILABLE">("ALL")
  const [battery, setBattery] = useState("0")
  const [distance, setDistance] = useState("5")
  const [passengers, setPassengers] = useState("1")
  const [rainy, setRainy] = useState(false)
  const [view, setView] = useState<"LIST" | "MAP">("LIST")

  const vehicles = useMemo(
    () =>
      data.vehicles
        .filter((vehicle) => {
          const hub = data.hubs.find((item) => item.id === vehicle.currentHubId)
          const text = `${vehicle.id} ${hub?.name ?? ""}`.toLowerCase()
          return (
            text.includes(query.toLowerCase()) &&
            (type === "ALL" || vehicle.type === type) &&
            (hubId === "ALL" || vehicle.currentHubId === hubId) &&
            (status === "ALL" || vehicle.usageStatus === status) &&
            vehicle.batteryLevel >= Number(battery)
          )
        })
        .sort((a, b) => {
          const aRecommended = recommendationFor(
            a,
            Number(distance),
            Number(passengers),
            rainy,
          )
          const bRecommended = recommendationFor(
            b,
            Number(distance),
            Number(passengers),
            rainy,
          )
          return Number(Boolean(bRecommended)) - Number(Boolean(aRecommended)) ||
            b.batteryLevel - a.batteryLevel
        }),
    [
      battery,
      data.hubs,
      data.vehicles,
      distance,
      hubId,
      passengers,
      query,
      rainy,
      status,
      type,
    ],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ST-02"
        title="Tìm phương tiện"
        description="So sánh phương tiện điện theo vị trí, hành trình và nhu cầu của bạn. Gợi ý phù hợp được ưu tiên nhưng không ẩn các lựa chọn khác."
      />

      <Card>
        <CardContent className="grid gap-4 lg:grid-cols-4">
          <TextInput
            label="Vị trí hoặc mã xe"
            placeholder="Tìm Hub, EV-..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <SelectField
            label="Mobility Hub"
            value={hubId}
            onChange={(event) => setHubId(event.target.value)}
          >
            <option value="ALL">Tất cả Mobility Hub</option>
            {data.hubs.map((hub) => (
              <option value={hub.id} key={hub.id}>
                {hub.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Loại phương tiện"
            value={type}
            onChange={(event) => setType(event.target.value as VehicleType | "ALL")}
          >
            <option value="ALL">Tất cả phương tiện</option>
            {Object.entries(vehicleTypeLabels).map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </SelectField>
          <SelectField
            label="Mức pin tối thiểu"
            value={battery}
            onChange={(event) => setBattery(event.target.value)}
          >
            <option value="0">Không giới hạn</option>
            <option value="40">Từ 40%</option>
            <option value="60">Từ 60%</option>
            <option value="80">Từ 80%</option>
          </SelectField>
          <SelectField
            label="Tình trạng"
            value={status}
            onChange={(event) => setStatus(event.target.value as "ALL" | "AVAILABLE")}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="AVAILABLE">Chỉ xe khả dụng</option>
          </SelectField>
          <SelectField
            label="Quãng đường dự kiến"
            value={distance}
            onChange={(event) => setDistance(event.target.value)}
          >
            <option value="3">Dưới 4 km</option>
            <option value="7">4–10 km</option>
            <option value="15">Trên 10 km</option>
          </SelectField>
          <SelectField
            label="Số hành khách"
            value={passengers}
            onChange={(event) => setPassengers(event.target.value)}
          >
            <option value="1">1 người</option>
            <option value="2">2 người</option>
            <option value="3">3–4 người</option>
          </SelectField>
          <label className="flex min-h-12 items-center gap-3 self-end rounded-xl border border-line bg-white px-4 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={rainy}
              onChange={(event) => setRainy(event.target.checked)}
              className="size-4 accent-brand"
            />
            <CloudRain className="size-4 text-info" /> Ưu tiên khi trời mưa
          </label>
          <div className="flex min-h-12 items-center justify-between gap-3 self-end rounded-xl bg-surface-muted p-1">
            <button
              className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${view === "LIST" ? "bg-white text-ink shadow-sm" : "text-ink-muted"}`}
              onClick={() => setView("LIST")}
              aria-pressed={view === "LIST"}
            ><List className="size-4" /> Danh sách</button>
            <button
              className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${view === "MAP" ? "bg-white text-ink shadow-sm" : "text-ink-muted"}`}
              onClick={() => setView("MAP")}
              aria-pressed={view === "MAP"}
            ><Map className="size-4" /> Bản đồ</button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted"><strong className="text-ink">{vehicles.length}</strong> phương tiện phù hợp</p>
        <p className="flex items-center gap-2 text-xs font-medium text-ink-muted"><Filter className="size-4" /> Sắp xếp theo độ phù hợp và mức pin</p>
      </div>

      {view === "LIST" ? (
        vehicles.length ? (
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                hubName={data.hubs.find((hub) => hub.id === vehicle.currentHubId)?.name ?? "Không xác định"}
                recommendation={recommendationFor(
                  vehicle,
                  Number(distance),
                  Number(passengers),
                  rainy,
                )}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="Không tìm thấy phương tiện"
            description="Hãy thay đổi bộ lọc hoặc giảm mức pin tối thiểu để xem thêm lựa chọn."
          />
        )
      ) : (
        <Card className="relative min-h-[32rem] overflow-hidden bg-slate-100">
          <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(#cbd5e1_1px,transparent_1px),linear-gradient(90deg,#cbd5e1_1px,transparent_1px)] [background-size:40px_40px]" />
          {data.hubs.map((hub, index) => {
            const count = vehicles.filter((item) => item.currentHubId === hub.id).length
            return (
              <Link
                key={hub.id}
                to={`/student/hubs/${hub.id}`}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-brand/20 bg-white p-3 shadow-lg transition hover:-translate-y-[55%]"
                style={{
                  left: `${18 + (index % 3) * 32}%`,
                  top: `${24 + Math.floor(index / 3) * 50}%`,
                }}
              >
                <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-brand text-white"><MapPin className="size-4" /></span><div><p className="text-xs font-semibold text-ink">{hub.name.replace("Mobility Hub ", "")}</p><p className="text-[11px] text-ink-muted">{count} xe phù hợp</p></div></div>
              </Link>
            )
          })}
        </Card>
      )}
    </div>
  )
}

export function VehicleDetailsPage() {
  const { id } = useParams()
  const { data, currentUser } = useAppStore()
  const vehicle = data.vehicles.find((item) => item.id === id)
  if (!vehicle) {
    return <EmptyState icon={Bike} title="Không tìm thấy phương tiện" description="Phương tiện không tồn tại trong dữ liệu mô phỏng." action={<Link className="button-primary" to="/student/vehicles">Về danh sách xe</Link>} />
  }
  const hub = data.hubs.find((item) => item.id === vehicle.currentHubId)
  const ownedReservation = data.vehicleReservations.find(
    (item) =>
      item.userId === currentUser?.id &&
      item.resourceId === vehicle.id &&
      (item.status === "CONFIRMED" || item.status === "ACTIVE"),
  )
  const eligible =
    vehicle.usageStatus === "AVAILABLE" &&
    vehicle.technicalCondition !== "MAJOR_DAMAGE" &&
    hub?.operationalStatus !== "UNAVAILABLE"

  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink" to="/student/vehicles"><ArrowLeft className="size-4" /> Quay lại tìm xe</Link>
      <PageHeader
        eyebrow="ST-03"
        title="Chi tiết phương tiện"
        description="Thông tin kỹ thuật và trạng thái phân bổ mới nhất từ dữ liệu mô phỏng."
        action={
          ownedReservation ? (
            <Link className="button-primary" to={ownedReservation.status === "ACTIVE" ? "/student/active-trip" : "/student/my-booking"}>
              Xem hoạt động hiện tại
            </Link>
          ) : eligible ? (
            <Link className="button-primary" to={`/student/vehicles/${vehicle.id}/reserve`}>Đặt phương tiện</Link>
          ) : (
            <Button disabled>Không thể đặt xe</Button>
          )
        }
      />
      {!eligible && !ownedReservation ? (
        <Notice tone="warning">Phương tiện không đủ điều kiện đặt do trạng thái sử dụng, kỹ thuật hoặc Hub hiện tại.</Notice>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_.9fr]">
        <VehicleVisual vehicle={vehicle} />
        <Card>
          <CardHeader title={`${vehicleTypeLabels[vehicle.type]} • ${vehicle.id}`} description={hub?.name ?? "Không xác định"} />
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Detail label="Mức pin"><BatteryIndicator value={vehicle.batteryLevel} /></Detail>
            <Detail label="Trạng thái"><Badge tone={vehicle.usageStatus === "AVAILABLE" ? "success" : "warning"}>{vehicleStatusLabels[vehicle.usageStatus]}</Badge></Detail>
            <Detail label="Tình trạng kỹ thuật" value={technicalLabels[vehicle.technicalCondition]} />
            <Detail label="Công-tơ-mét" value={`${vehicle.odometer.toLocaleString("vi-VN")} km`} />
            <Detail label="Biển số" value={vehicle.licensePlate ?? "Không áp dụng"} />
            <Detail label="Cập nhật cuối" value="08:30 • 18/03/2026" />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <InfoTile icon={ShieldCheck} title="Kiểm tra kỹ thuật" text={technicalLabels[vehicle.technicalCondition]} />
        <InfoTile icon={MapPin} title="Hub hiện tại" text={hub?.location ?? "Không xác định"} />
        <InfoTile icon={Gauge} title="Phạm vi ước tính" text={`${Math.round(vehicle.batteryLevel * (vehicle.type === "ELECTRIC_CAR" ? 2.4 : 0.8))} km`} />
      </div>
    </div>
  )
}

function Detail({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}</p><div className="mt-2 font-medium text-ink">{children ?? value}</div></div>
}

function InfoTile({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) {
  return <Card className="flex items-center gap-4 p-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Icon className="size-5" /></span><div><p className="text-sm font-semibold text-ink">{title}</p><p className="mt-1 text-sm text-ink-muted">{text}</p></div></Card>
}

export function VehicleReservationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, reserveVehicle } = useAppStore()
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null)
  const vehicle = data.vehicles.find((item) => item.id === id)
  const hub = data.hubs.find((item) => item.id === vehicle?.currentHubId)

  if (!vehicle || !hub) {
    return <EmptyState icon={Bike} title="Không thể đặt phương tiện" description="Thông tin phương tiện hoặc Mobility Hub không hợp lệ." />
  }
  const confirm = () => {
    const result = reserveVehicle(vehicle.id)
    setNotice(result)
    if (result.ok) navigate("/student/my-booking")
  }
  const eligible =
    vehicle.usageStatus === "AVAILABLE" &&
    vehicle.technicalCondition !== "MAJOR_DAMAGE"

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader eyebrow="ST-04" title="Xác nhận đặt xe" description="Kiểm tra lại phương tiện và điểm nhận trước khi xác nhận." />
      {notice ? <Notice tone={notice.ok ? "success" : "error"}>{notice.message}</Notice> : null}
      <Card>
        <CardContent className="grid gap-6 md:grid-cols-[15rem_1fr]">
          <VehicleVisual vehicle={vehicle} compact />
          <div>
            <div className="flex items-start justify-between gap-4"><div><p className="text-sm text-ink-muted">{vehicle.id}</p><h2 className="text-xl font-semibold text-ink">{vehicleTypeLabels[vehicle.type]}</h2></div><Badge tone={eligible ? "success" : "warning"}>{vehicleStatusLabels[vehicle.usageStatus]}</Badge></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2"><Detail label="Điểm nhận xe" value={hub.name} /><Detail label="Mức pin"><BatteryIndicator value={vehicle.batteryLevel} /></Detail><Detail label="Kỹ thuật" value={technicalLabels[vehicle.technicalCondition]} /><Detail label="Thời hạn nhận" value="Trong vòng 15 phút" /></div>
          </div>
        </CardContent>
      </Card>
      <Notice tone="info">Hệ thống sẽ kiểm tra lại trạng thái xe ngay tại thời điểm xác nhận để ngăn đặt trùng.</Notice>
      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Button variant="secondary" onClick={() => navigate(-1)}>Quay lại</Button>
        <Button disabled={!eligible} onClick={confirm}>Xác nhận đặt xe</Button>
      </div>
    </div>
  )
}

export function MyVehicleBookingPage() {
  const navigate = useNavigate()
  const { data, currentUser, pickupVehicle, cancelVehicleReservation } = useAppStore()
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null)
  const reservation = data.vehicleReservations.find(
    (item) => item.userId === currentUser?.id && item.status === "CONFIRMED",
  )
  const activeReservation = data.vehicleReservations.find(
    (item) => item.userId === currentUser?.id && item.status === "ACTIVE",
  )
  if (!reservation) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="ST-05" title="Xe đã đặt / Đang sử dụng" description="Quản lý xe đã đặt hoặc chuyển đến chuyến đi đang hoạt động." />
        {notice ? <Notice tone={notice.ok ? "success" : "error"}>{notice.message}</Notice> : null}
        {activeReservation ? (
          <EmptyState icon={Route} title="Bạn đang sử dụng phương tiện" description={"Chuyến đi " + activeReservation.id + " đang hoạt động."} action={<Link className="button-primary" to="/student/active-trip">Xem chuyến đi hiện tại</Link>} />
        ) : (
          <EmptyState icon={Bike} title="Bạn chưa có xe đã đặt" description="Tìm một phương tiện phù hợp để bắt đầu hành trình." action={<Link className="button-primary" to="/student/vehicles">Tìm phương tiện</Link>} />
        )}
      </div>
    )
  }
  const vehicle = data.vehicles.find((item) => item.id === reservation.resourceId)!
  const hub = data.hubs.find((item) => item.id === reservation.pickupHubId)!
  const pickup = () => {
    const result = pickupVehicle(reservation.id)
    setNotice(result)
    if (result.ok) navigate("/student/active-trip")
  }
  const cancel = () => {
    if (!window.confirm("Bạn có chắc muốn hủy lượt đặt xe này?")) return
    setNotice(cancelVehicleReservation(reservation.id))
  }
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="ST-05" title="Xe đã đặt / Đang sử dụng" description="Đến đúng Mobility Hub và xác nhận nhận xe khi bạn đã ở cạnh phương tiện." />
      {notice ? <Notice tone={notice.ok ? "success" : "error"}>{notice.message}</Notice> : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_.7fr]">
        <Card>
          <CardContent className="grid gap-6 sm:grid-cols-[12rem_1fr]">
            <VehicleVisual vehicle={vehicle} compact />
            <div><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-ink-muted">{reservation.id}</p><h2 className="mt-1 text-xl font-semibold text-ink">{vehicle.id} • {vehicleTypeLabels[vehicle.type]}</h2></div><Badge tone="info">Đã xác nhận</Badge></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Detail label="Điểm nhận" value={hub.name} /><Detail label="Mức pin"><BatteryIndicator value={vehicle.batteryLevel} /></Detail></div></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Các bước nhận xe" />
          <CardContent className="space-y-4">
            {["Đến đúng Mobility Hub", "Đối chiếu mã phương tiện", "Kiểm tra ngoại quan", "Xác nhận nhận xe"].map((item, index) => <div className="flex items-center gap-3" key={item}><span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-strong">{index + 1}</span><p className="text-sm font-medium text-ink">{item}</p></div>)}
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        <Link className="button-secondary" to={`/student/vehicles/${vehicle.id}`}>Xem chi tiết</Link>
        <Button variant="danger" onClick={cancel}>Hủy đặt xe</Button>
        <Button onClick={pickup}>Xác nhận nhận xe</Button>
      </div>
    </div>
  )
}

export function ActiveTripPage() {
  const { data, currentUser } = useAppStore()
  const reservation = data.vehicleReservations.find(
    (item) => item.userId === currentUser?.id && item.status === "ACTIVE",
  )
  if (!reservation) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="ST-06" title="Chuyến đi hiện tại" description="Theo dõi phương tiện và trạng thái chuyến đi đang hoạt động." />
        <EmptyState icon={Route} title="Không có chuyến đi đang hoạt động" description="Nhận một phương tiện đã đặt để bắt đầu chuyến đi." action={<Link className="button-primary" to="/student/my-booking">Xem xe đã đặt</Link>} />
      </div>
    )
  }
  const vehicle = data.vehicles.find((item) => item.id === reservation.resourceId)!
  const hub = data.hubs.find((item) => item.id === reservation.pickupHubId)!
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="ST-06" title="Chuyến đi hiện tại" description="Phương tiện đang được ghi nhận trong chuyến đi của bạn." action={<Link className="button-primary" to="/student/return-vehicle">Trả phương tiện</Link>} />
      <Notice tone="success">Chuyến đi đang hoạt động. Hãy tuân thủ quy định an toàn và trả xe tại Mobility Hub có chỗ đỗ phù hợp.</Notice>
      <div className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
        <VehicleVisual vehicle={vehicle} />
        <Card>
          <CardHeader title={`${vehicle.id} • ${vehicleTypeLabels[vehicle.type]}`} description={`Mã chuyến: ${reservation.id}`} />
          <CardContent className="grid gap-5 sm:grid-cols-2"><Detail label="Trạng thái" value="Đang sử dụng" /><Detail label="Pin hiện tại"><BatteryIndicator value={vehicle.batteryLevel} /></Detail><Detail label="Hub nhận xe" value={hub.name} /><Detail label="Cập nhật trạng thái" value="Vừa xong" /></CardContent>
        </Card>
      </div>
      <Card className="p-5"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-info"><Navigation className="size-5" /></span><div><h2 className="font-semibold text-ink">Trạng thái hành trình</h2><p className="mt-1 text-sm leading-6 text-ink-muted">Dữ liệu vị trí trong bản demo chỉ thể hiện Hub nhận và Hub trả, không theo dõi vị trí thực tế của người dùng.</p></div></div></Card>
    </div>
  )
}

export function VehicleReturnPage() {
  const { data, currentUser, returnVehicle } = useAppStore()
  const [hubId, setHubId] = useState("")
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null)
  const reservation = data.vehicleReservations.find(
    (item) => item.userId === currentUser?.id && item.status === "ACTIVE",
  )
  const vehicle = data.vehicles.find((item) => item.id === reservation?.resourceId)
  const selectedHub = data.hubs.find((item) => item.id === hubId)
  const availableSpaces = vehicle
    ? data.parkingSpaces.filter(
        (item) =>
          item.hubId === hubId &&
          item.status === "AVAILABLE" &&
          item.compatibleVehicleTypes.includes(vehicle.type),
      ).length
    : 0
  const ownedSpace = vehicle
    ? data.parkingReservations.some(
        (item) =>
          item.userId === currentUser?.id &&
          item.vehicleId === vehicle.id &&
          item.hubId === hubId &&
          item.status === "CONFIRMED",
      )
    : false

  if (!reservation || !vehicle) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="ST-07" title="Trả phương tiện" description="Chọn Mobility Hub và xác nhận tài nguyên đỗ trước khi trả xe." />
        {notice?.ok ? <Notice tone="success">{notice.message}</Notice> : null}
        <EmptyState icon={CircleParking} title="Không có phương tiện cần trả" description="Bạn hiện không có chuyến đi đang hoạt động." action={<Link className="button-primary" to="/student/dashboard">Về tổng quan</Link>} />
      </div>
    )
  }
  const submit = () => {
    const result = returnVehicle(hubId)
    setNotice(result)
  }
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="ST-07" title="Trả phương tiện" description="Hệ thống sẽ kiểm tra trạng thái Hub và phân bổ chỗ đỗ tương thích trước khi hoàn tất." />
      {notice ? <Notice tone={notice.ok ? "success" : "error"}>{notice.message}</Notice> : null}
      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <Card>
          <CardHeader title="Phương tiện đang sử dụng" />
          <CardContent><VehicleVisual vehicle={vehicle} compact /><div className="mt-4 flex items-center justify-between"><div><p className="font-semibold text-ink">{vehicle.id}</p><p className="text-sm text-ink-muted">{vehicleTypeLabels[vehicle.type]}</p></div><BatteryIndicator value={vehicle.batteryLevel} /></div></CardContent>
        </Card>
        <Card>
          <CardHeader title="Chọn điểm trả" description="Chỉ Hub còn tài nguyên tương thích mới có thể tiếp nhận." />
          <CardContent className="space-y-5">
            <SelectField label="Mobility Hub đích" value={hubId} onChange={(event) => setHubId(event.target.value)}>
              <option value="">Chọn Mobility Hub</option>
              {data.hubs.map((hub) => <option value={hub.id} key={hub.id}>{hub.name}</option>)}
            </SelectField>
            {selectedHub ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoTile icon={MapPin} title="Trạng thái Hub" text={hubStatusLabels[selectedHub.operationalStatus]} />
                <InfoTile icon={CircleParking} title="Chỗ tương thích" text={`${availableSpaces} chỗ trống`} />
                <InfoTile icon={CheckCircle2} title="Chỗ đã đặt" text={ownedSpace ? "Có phân bổ" : "Không có"} />
              </div>
            ) : null}
            {selectedHub && availableSpaces === 0 && !ownedSpace ? <Notice tone="error">Hub này không còn chỗ đỗ tương thích. Hãy chọn Hub khác.</Notice> : null}
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end"><Button disabled={!hubId || (availableSpaces === 0 && !ownedSpace)} onClick={submit}>Xác nhận trả phương tiện</Button></div>
    </div>
  )
}
