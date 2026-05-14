import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { AppError } from "@/utils/errors";
import { env } from "@/config/env";

export function errorHandler(err: Error, c: Context) {
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err);

  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
      },
      err.statusCode as 400
    );
  }

  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: err.flatten().fieldErrors,
        },
      },
      422
    );
  }

  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: {
          code: "HTTP_ERROR",
          message: err.message,
        },
      },
      err.status
    );
  }

  // Handle database unique constraint
  const msg = err.message || "";
  if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
    return c.json(
      {
        success: false,
        error: {
          code: "CONFLICT",
          message: "A record with this value already exists",
        },
      },
      409
    );
  }

  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: env.NODE_ENV === "production" ? "Something went wrong" : err.message,
        ...(env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
      },
    },
    500
  );
}
