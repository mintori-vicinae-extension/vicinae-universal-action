# Vicinae Universal Action Extension

Port của `anyrun-universal-action` sang chuẩn Raycast / Vicinae Extension, cho phép định nghĩa các action ngữ cảnh thông minh hoàn toàn bằng TypeScript.

## Tính năng

- **Cấu hình 100% bằng TypeScript**: Khai báo action trong `src/actions.config.ts` với đầy đủ type-safe autocomplete.
- **Tự động nhận diện nội dung**: Phân loại YouTube URL, Web URL, System Path, Image, và Code/Programming Language qua `@google/magika`.
- **Runtime Helpers tích hợp**:
  - `runShell(cmd)`: Chạy script bash/zsh không block UI.
  - `saveFile(path, content)`: Lưu file tự động tạo thư mục cha.
  - `resolvePath(path)`: Giải quyết path dạng `~` hoặc `$HOME`.
  - `copyToClipboard(text)`: Ghi lại clipboard.
  - `notify(title, message)`: Hiển thị toast thông báo.

## Cách thêm Action mới (`src/actions.config.ts`)

```typescript
import { Icon } from "@raycast/api";
import { ActionDefinition } from "./types";

export const actions: ActionDefinition[] = [
  {
    name: "Tên Action",
    icon: Icon.Terminal,
    category: { type: "code", lang: "rust" }, // hoặc "all", "plaintext", { type: "system", kind: "path" }
    run: async ({ clip, extension }, { runShell, notify }) => {
      await runShell(`cargo run -- "${clip}"`);
      await notify("Thành công");
    },
  },
];
```

## Cài đặt & Chạy thử nghiệm

```bash
cd ~/Projects/personal/vicinae-universal-action
npm install
npm run dev
```
