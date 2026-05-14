import { app } from "./app";
import { env } from "@/config/env";

console.log(`🚀 e-Hiseb API running on http://localhost:${env.PORT}`);
console.log(`📚 Environment: ${env.NODE_ENV}`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
