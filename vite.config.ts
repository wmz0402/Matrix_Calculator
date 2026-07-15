import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
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
