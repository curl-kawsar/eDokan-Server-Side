import type { Context } from "hono";
import { z } from "zod";
import { partService } from "./part.service";
import { paginationSchema } from "@/utils/pagination";
import { success, created, paginated } from "@/utils/response";

const listQuerySchema = paginationSchema.extend({
  lowStock: z.coerce.boolean().optional(),
});

export const partController = {
  async list(c: Context) {
    const params = listQuerySchema.parse(c.req.query());
    const { rows, total } = await partService.list(params);
    return paginated(c, rows, { page: params.page, limit: params.limit, total });
  },

  async get(c: Context) {
    const data = await partService.getById(c.req.param("id") as string);
    return success(c, data);
  },

  async create(c: Context) {
    const body = await c.req.json();
    const data = await partService.create(body);
    return created(c, data, "পার্টস সফলভাবে যুক্ত হয়েছে");
  },

  async update(c: Context) {
    const body = await c.req.json();
    const data = await partService.update(c.req.param("id") as string, body);
    return success(c, data, "পার্টসের তথ্য আপডেট হয়েছে");
  },

  async remove(c: Context) {
    const id = c.req.param("id") as string;
    await partService.delete(id);
    return success(c, { id }, "পার্টস মুছে ফেলা হয়েছে");
  },

  async adjustStock(c: Context) {
    const id = c.req.param("id") as string;
    const body = await c.req.json();
    const data = await partService.adjustStock(id, body);
    return success(c, data, "স্টক হালনাগাদ হয়েছে");
  },
};
