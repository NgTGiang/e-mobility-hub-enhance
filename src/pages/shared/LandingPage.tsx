import {
  ArrowRight,
  BarChart3,
  BatteryCharging,
  Bike,
  Building2,
  CheckCircle2,
  Leaf,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { Link } from "react-router"
import { BrandMark } from "@/components/BrandMark"
import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-page">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <BrandMark />
        <Link className="button-secondary" to="/login">
          Đăng nhập
        </Link>
      </header>

      <main id="main-content">
        <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 md:px-8 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div className="relative z-10">
            <Badge tone="success">
              <Sparkles className="mr-1.5 size-3.5" /> Nền tảng điều phối di
              chuyển xanh
            </Badge>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-ink md:text-5xl">
              Mỗi hành trình thông minh hơn. Mỗi khuôn viên xanh hơn.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-muted">
              Hệ thống điều phối phương tiện điện, chỗ đỗ và hạ tầng sạc trong
              Khu đô thị ĐHQG-HCM trên một nền tảng thống nhất.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="button-primary" to="/login">
                Truy cập hệ thống <ArrowRight className="size-4" />
              </Link>
              <a className="button-secondary" href="#features">
                Khám phá nền tảng
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-muted">
              {[
                "Dữ liệu mô phỏng minh bạch",
                "Phân quyền theo vai trò",
                "Thiết kế đa thiết bị",
              ].map((item) => (
                <span className="flex items-center gap-2" key={item}>
                  <CheckCircle2 className="size-4 text-brand" /> {item}
                </span>
              ))}
            </div>
          </div>

          <div
            className="relative min-h-[28rem]"
            aria-label="Minh họa mạng lưới di chuyển điện"
          >
            <div className="absolute inset-8 rounded-full bg-brand-soft blur-3xl" />
            <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand/20 bg-white shadow-2xl">
              <div className="grid h-full place-items-center text-center">
                <div>
                  <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-brand text-white shadow-lg shadow-brand/20">
                    <Leaf className="size-10" />
                  </div>
                  <p className="mt-4 text-xl font-bold text-ink">
                    Mạng lưới xanh
                  </p>
                  <p className="text-sm text-ink-muted">6 Mobility Hubs</p>
                </div>
              </div>
            </div>
            {[
              {
                icon: Bike,
                label: "30 phương tiện",
                position: "left-0 top-12",
                color: "bg-lime-50 text-lime-700",
              },
              {
                icon: BatteryCharging,
                label: "15 cổng sạc",
                position: "right-0 top-5",
                color: "bg-blue-50 text-info",
              },
              {
                icon: Building2,
                label: "40 chỗ đỗ",
                position: "bottom-10 left-6",
                color: "bg-amber-50 text-amber-700",
              },
              {
                icon: BarChart3,
                label: "Theo dõi tức thời",
                position: "bottom-6 right-0",
                color: "bg-brand-soft text-brand-strong",
              },
            ].map((item) => (
              <Card
                className={`absolute ${item.position} flex items-center gap-3 p-4 shadow-lg`}
                key={item.label}
              >
                <span
                  className={`grid size-10 place-items-center rounded-xl ${item.color}`}
                >
                  <item.icon className="size-5" />
                </span>
                <span className="whitespace-nowrap text-sm font-semibold text-ink">
                  {item.label}
                </span>
              </Card>
            ))}
          </div>
        </section>

        <section id="features" className="border-y border-line bg-white">
          <div className="mx-auto grid max-w-7xl gap-5 px-5 py-16 md:grid-cols-3 md:px-8">
            {[
              {
                icon: Bike,
                title: "Dành cho sinh viên",
                text: "Tìm xe, đặt chỗ đỗ và đăng ký lịch sạc với quy trình rõ ràng.",
              },
              {
                icon: BarChart3,
                title: "Dành cho điều phối viên",
                text: "Theo dõi công suất, tài nguyên và sự cố trên toàn mạng lưới.",
              },
              {
                icon: ShieldCheck,
                title: "Vận hành nhất quán",
                text: "Một nguồn dữ liệu tập trung và các quy tắc chuyển trạng thái được kiểm soát.",
              },
            ].map((feature) => (
              <div
                className="rounded-2xl border border-line p-6"
                key={feature.title}
              >
                <span className="grid size-12 place-items-center rounded-xl bg-brand-soft text-brand">
                  <feature.icon className="size-6" />
                </span>
                <h2 className="mt-5 text-lg font-semibold text-ink">
                  {feature.title}
                </h2>
                <p className="mt-2 leading-6 text-ink-muted">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
