import type { Config } from "@react-router/dev/config";

const appBasePath = process.env.APP_BASE_PATH || "/kahoot-builder";
const basename = appBasePath === "/"
  ? "/"
  : `/${appBasePath.replace(/^\/+|\/+$/g, "")}/`;

export default {
  basename,
  ssr: true,
} satisfies Config;
