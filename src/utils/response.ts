import type { Context } from "hono";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: Record<string, unknown>;
}

export function success<T>(c: Context, data: T, message?: string, status = 200) {
  return c.json<ApiResponse<T>>(
    {
      success: true,
      data,
      ...(message ? { message } : {}),
    },
    status as 200
  );
}

export function created<T>(c: Context, data: T, message = "Created successfully") {
  return success(c, data, message, 201);
}

export function paginated<T>(
  c: Context,
  data: T[],
  meta: { page: number; limit: number; total: number }
) {
  const totalPages = Math.ceil(meta.total / meta.limit) || 1;
  return c.json<ApiResponse<T[]>>(
    {
      success: true,
      data,
      meta: { ...meta, totalPages },
    },
    200
  );
}
