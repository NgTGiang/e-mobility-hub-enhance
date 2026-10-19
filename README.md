# E-Mobility Hub Demo

Ứng dụng web demo được xây dựng bằng React 19, TypeScript, Vite và Tailwind CSS.

## Yêu cầu môi trường

Trước khi bắt đầu, hãy cài:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) phiên bản 22 trở lên
- [Visual Studio Code](https://code.visualstudio.com/)
- pnpm:

```bash
npm install -g pnpm
```

Kiểm tra các phiên bản đã cài:

```bash
node --version
pnpm --version
git --version
```

## 1. Tải source code

Mở Terminal hoặc PowerShell và chạy:

```bash
git clone https://github.com/NgTGiang/e-mobility-hub-enhance.git
cd e-mobility-hub-enhance
```

## 2. Mở project bằng VS Code

Tại thư mục project, chạy:

```bash
code .
```

Nếu lệnh `code` chưa hoạt động, mở VS Code, chọn **File → Open Folder...**, sau đó chọn thư mục `e-mobility-hub-enhance`.

## 3. Cài dependencies

Mở Terminal trong VS Code bằng menu **Terminal → New Terminal**, sau đó chạy:

```bash
pnpm install
```

## 4. Chạy web demo

```bash
pnpm dev
```

Terminal sẽ hiển thị địa chỉ local, thông thường là:

```text
http://localhost:5173
```

Giữ Terminal đang chạy và mở địa chỉ trên bằng trình duyệt. Khi chỉnh sửa source code, Vite sẽ tự động cập nhật trang.

Để dừng server, nhấn:

```text
Ctrl + C
```

## Các lệnh hữu ích

| Lệnh | Chức năng |
| --- | --- |
| `pnpm dev` | Chạy development server |
| `pnpm build` | Tạo bản build production trong thư mục `dist` |
| `pnpm preview` | Xem thử bản production build ở local |
| `pnpm format` | Format source code |

Để kiểm tra bản production:

```bash
pnpm build
pnpm preview
```

## Xử lý lỗi thường gặp

### `pnpm` is not recognized hoặc `pnpm: command not found`

Cài pnpm rồi mở lại Terminal:

```bash
npm install -g pnpm
```

### Port 5173 đang được sử dụng

Chạy ứng dụng bằng port khác:

```bash
pnpm dev -- --port 5174
```

Sau đó mở:

```text
http://localhost:5174
```

### Dependencies bị lỗi

Xóa dependencies cũ và cài lại:

**macOS/Linux:**

```bash
rm -rf node_modules
pnpm install
```

**Windows PowerShell:**

```powershell
Remove-Item -Recurse -Force node_modules
pnpm install
```

## Cấu trúc chính

```text
src/
├── app/          # Router và cấu hình ứng dụng
├── components/   # Các component dùng chung
├── layouts/      # Layout cho Student và Operator
├── pages/        # Các trang của ứng dụng
├── services/     # Xử lý nghiệp vụ demo
├── store/        # State dùng chung
├── types/        # TypeScript types
├── App.tsx
└── main.tsx
```
