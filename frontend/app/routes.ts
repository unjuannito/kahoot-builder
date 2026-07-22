import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("profile", "routes/profile.tsx"),
  route("sessions", "routes/sessions.tsx"),
  route("session/:code", "routes/session.$code.tsx"),
  route("session/:code/import", "routes/session-import.$code.tsx"),
] satisfies RouteConfig;
