import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const appBasePath = process.env.APP_BASE_PATH ?? "/";
const normalizedBasePath = appBasePath === "/"
  ? "/"
  : `/${appBasePath.replace(/^\/+|\/+$/g, "")}/`;
const backendTarget = process.env.VITE_BACKEND_URL ?? "http://localhost:3000";

export default defineConfig({
  base: normalizedBasePath,
  plugins: [tailwindcss(), reactRouter()],
  server: {
    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
});
