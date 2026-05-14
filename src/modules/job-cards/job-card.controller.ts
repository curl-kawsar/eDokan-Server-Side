import type { Context } from "hono";
import { z } from "zod";
import { jobCardService } from "./job-card.service";
import { paginationSchema } from "@/utils/pagination";
import { success, created, paginated } from "@/utils/response";
import { jobStatusValues } from "./job-card.schema";

const listQuerySchema = paginationSchema.extend({
  status: z.enum(jobStatusValues).optional(),
  customerId: z.string().uuid().optional(),
});

export const jobCardController = {
  async list(c: Context) {
    const params = listQuerySchema.parse(c.req.query());
    const { rows, total } = await jobCardService.list(params);
    return paginated(c, rows, { page: params.page, limit: params.limit, total });
  },
  async get(c: Context) {
    const data = await jobCardService.getById(c.req.param("id") as string);
    return success(c, data);
  },
  async create(c: Context) {
    const body = await c.req.json();
    const data = await jobCardService.create(body);
    return created(c, data, "জব কার্ড সফলভাবে তৈরি হয়েছে");
  },
  async update(c: Context) {
    const body = await c.req.json();
    const data = await jobCardService.update(c.req.param("id") as string, body);
    return success(c, data, "জব কার্ড আপডেট হয়েছে");
  },
  async updateStatus(c: Context) {
    const body = await c.req.json();
    const data = await jobCardService.updateStatus(c.req.param("id") as string, body.status);
    return success(c, data, "স্ট্যাটাস পরিবর্তন হয়েছে");
  },
  async remove(c: Context) {
    const id = c.req.param("id") as string;
    await jobCardService.delete(id);
    return success(c, { id }, "জব কার্ড মুছে ফেলা হয়েছে");
  },
};
