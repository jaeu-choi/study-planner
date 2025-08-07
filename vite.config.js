import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @tailwindcss/vite 제거하고 기본 설정 사용
export default defineConfig({
  plugins: [react()],
  base: "./", // Electron용 상대 경로
});
