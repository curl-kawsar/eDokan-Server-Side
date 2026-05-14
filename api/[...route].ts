import { handle } from "hono/vercel";
// Bundled on deploy: `npm run vercel-build` resolves `@/` path aliases for Node runtime
import { app } from "./_app.mjs";

const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export default handler;
