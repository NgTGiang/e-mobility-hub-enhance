import {
  ArrowLeft,
  BarChart3,
  Bike,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react"
import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import { BrandMark } from "@/components/BrandMark"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { TextInput } from "@/components/ui/TextInput"
import { useAppStore } from "@/store/appStore"
import type { UserRole } from "@/types/domain"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { loginAs } = useAppStore()
  const navigate = useNavigate()

  const enterAs = (role: UserRole) => {
    loginAs(role)
    navigate("/auth/redirect")
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.")
      return
    }
    const account = email.trim().toLowerCase()
    const role =
      account === "sinhvien" || account === "sinhvien@demo.vn"
        ? "STUDENT"
        : account === "dieuphoi" || account === "dieuphoi@demo.vn"
          ? "OPERATOR"
          : null
    if (!role || password !== "demo123") {
      setError(
        "Tài khoản hoặc mật khẩu không đúng. Hãy dùng thông tin demo bên dưới.",
      )
      return
    }
    setError("")
    enterAs(role)
  }

  return (
    <main
      id="main-content"
      className="grid min-h-screen bg-page lg:grid-cols-[.9fr_1.1fr]"
    >
      <section className="flex items-center justify-center p-5 md:p-10">
        <div className="w-full max-w-md">
          <Link
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink"
            to="/"
          >
            <ArrowLeft className="size-4" /> Về trang chủ
          </Link>
          <BrandMark />
          <div className="mt-10">
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              Chào mừng trở lại
            </h1>
            <p className="mt-2 text-ink-muted">
              Đăng nhập để tiếp tục sử dụng Smart E-Mobility Hub.
            </p>
          </div>
          <form className="mt-8 grid gap-5" onSubmit={submit}>
            <TextInput
              label="Email hoặc tên đăng nhập"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setError("")
              }}
              placeholder="tenban@demo.vn"
              autoComplete="username"
            />
            <TextInput
              label="Mật khẩu"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError("")
              }}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
            />
            {error ? (
              <p
                className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-danger"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <Button type="submit" icon={LockKeyhole}>
              Đăng nhập
            </Button>
          </form>

          <div className="my-7 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-slate-400">
            <span className="h-px flex-1 bg-line" /> Tài khoản demo{" "}
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="secondary"
              icon={Bike}
              onClick={() => enterAs("STUDENT")}
            >
              Sinh viên
            </Button>
            <Button
              variant="secondary"
              icon={BarChart3}
              onClick={() => enterAs("OPERATOR")}
            >
              Điều phối viên
            </Button>
          </div>
          <div className="mt-4 rounded-xl bg-surface-muted p-4 text-xs leading-5 text-ink-muted">
            <p>
              Sinh viên: <strong>sinhvien@demo.vn</strong>
            </p>
            <p>
              Điều phối viên: <strong>dieuphoi@demo.vn</strong>
            </p>
            <p>
              Mật khẩu dùng chung: <strong>demo123</strong>
            </p>
          </div>
        </div>
      </section>
      <section className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-brand/30 blur-3xl" />
        <div className="absolute -bottom-20 left-20 size-80 rounded-full bg-lime/10 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm">
            <ShieldCheck className="size-4 text-mint" /> Môi trường mô phỏng an
            toàn
          </span>
          <h2 className="mt-8 max-w-2xl text-4xl font-bold leading-tight">
            Điều phối tài nguyên di chuyển xanh trên một nền tảng duy nhất.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Dữ liệu trong bản demo được mô phỏng có kiểm soát và không phản ánh
            hạ tầng triển khai thực tế.
          </p>
        </div>
        <Card className="relative border-white/10 bg-white/10 p-6 text-white backdrop-blur">
          <p className="text-sm text-slate-300">Phạm vi dữ liệu nền tảng</p>
          <div className="mt-5 grid grid-cols-3 gap-4">
            {[
              ["6", "Mobility Hubs"],
              ["30", "Phương tiện"],
              ["55", "Tài nguyên tĩnh"],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="text-3xl font-bold">{value}</p>
                <p className="mt-1 text-xs text-slate-300">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  )
}
