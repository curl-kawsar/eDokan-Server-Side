import type { Context } from "hono";
import { z } from "zod";
import { expenseService } from "./expense.service";
import { paginationSchema } from "@/utils/pagination";
import { success, created, paginated } from "@/utils/response";

const listQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const expenseController = {
  async list(c: Context) {
    const params = listQuerySchema.parse(c.req.query());
    const { rows, total } = await expenseService.list(params);
    return paginated(c, rows, { page: params.page, limit: params.limit, total });
  },
  async get(c: Context) {
    const data = await expenseService.getById(c.req.param("id") as string);
    return success(c, data);
  },
  async create(c: Context) {
    const body = await c.req.json();
    const data = await expenseService.create(body);
    return created(c, data, "খরচ সংরক্ষণ হয়েছে");
  },
  async update(c: Context) {
    const body = await c.req.json();
    const data = await expenseService.update(c.req.param("id") as string, body);
    return success(c, data, "খরচ আপডেট হয়েছে");
  },
  async remove(c: Context) {
    const id = c.req.param("id") as string;
    await expenseService.delete(id);
    return success(c, { id }, "খরচ মুছে ফেলা হয়েছে");
  },
};
