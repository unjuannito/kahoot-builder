import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const appBasePath = process.env.APP_BASE_PATH || "/kahoot-builder";
const normalizedBasePath = appBasePath === "/"
  ? "/"
  : `/${appBasePath.replace(/^\/+|\/+$/g, "")}/`;

export default defineConfig({
  base: normalizedBasePath,
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
});
