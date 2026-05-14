import type { Context, Next } from "hono";
import { verifyToken, type JwtPayload } from "@/utils/jwt";
import { UnauthorizedError, ForbiddenError } from "@/utils/errors";

declare module "hono" {
  interface ContextVariableMap {
    user: JwtPayload;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid authorization header");
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  c.set("user", payload);

  await next();
}

export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    if (!user || !allowedRoles.includes(user.role)) {
      throw new ForbiddenError("You do not have permission to perform this action");
    }
    await next();
  };
}
