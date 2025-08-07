import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "./", // Electron용 상대 경로
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
