import { RouterProvider } from "react-router"
import { router } from "./routes"

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Chuyển đến nội dung chính
      </a>
      <RouterProvider router={router} />
    </>
  )
}
