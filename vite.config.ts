import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  // GitHub Pages 工作流会根据当前仓库自动注入部署子路径。
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [vue()],
  server: {
    open: false,
  },
  test: {
    environment: "node",
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
