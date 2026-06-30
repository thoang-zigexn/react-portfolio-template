# CLAUDE.md

## Mục tiêu
Portfolio cá nhân dạng single-page, hiển thị danh sách project có thể tìm kiếm
(lọc theo title / mô tả / tags). Ưu tiên giữ codebase nhỏ, dễ test.

## Stack
- Vite 6 + React 18 (JavaScript, không TypeScript)
- SCSS cho styling, Bootstrap 5
- Vitest 4 + Testing Library cho test (môi trường jsdom)
- ESLint cho lint

## Quy ước code
- Logic thuần (filter/search/transform) tách khỏi component, đặt trong `src/lib/`,
  export thành hàm pure không phụ thuộc React/DOM.
- Component chỉ import và gọi hàm thuần, không nhúng logic lọc inline.
- Search lọc trên `item.locales.title`, `item.locales.text`, `item.locales.tags[]`,
  match case-insensitive substring. Xem `src/lib/search.js`.
- Mỗi hàm thuần phải có test tương ứng trong cùng thư mục (`*.test.js`).

## Chạy test
- `npm test` — chạy một lần (dùng cho CI).
- `npm run test:watch` — chế độ watch khi phát triển.
- `npm run lint` — chạy ESLint.
