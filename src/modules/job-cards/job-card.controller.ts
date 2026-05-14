import type { Context } from "hono";
import { z } from "zod";
import { appendActivity } from "@/modules/activity-logs/activity-log.service";
import { jobStatusBn } from "@/modules/activity-logs/labels";
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
    const user = c.get("user");
    const body = await c.req.json();
    const data = await jobCardService.create(body);
    await appendActivity({
      entityType: "job_card",
      entityId: data.id,
      userId: user.sub,
      action: "created",
      summary: `জব কার্ড ${data.jobNo} তৈরি হয়েছে`,
      meta: { jobNo: data.jobNo },
    });
    return created(c, data, "জব কার্ড সফলভাবে তৈরি হয়েছে");
  },
  async update(c: Context) {
    const user = c.get("user");
    const id = c.req.param("id") as string;
    const body = await c.req.json();
    const before = await jobCardService.getById(id);
    const data = await jobCardService.update(id, body);
    const keys = Object.keys(body).filter((k) => body[k as keyof typeof body] !== undefined);
    let summary = `জব কার্ড ${data.jobNo} আপডেট`;
    if (body.status !== undefined && body.status !== before.status) {
      summary = `স্ট্যাটাস ${jobStatusBn[before.status] ?? before.status} → ${jobStatusBn[body.status] ?? body.status}`;
    }
    await appendActivity({
      entityType: "job_card",
      entityId: id,
      userId: user.sub,
      action: "updated",
      summary,
      meta: { jobNo: data.jobNo, keys, status: before.status !== data.status ? { from: before.status, to: data.status } : undefined },
    });
    return success(c, data, "জব কার্ড আপডেট হয়েছে");
  },
  async updateStatus(c: Context) {
    const user = c.get("user");
    const id = c.req.param("id") as string;
    const body = await c.req.json();
    const before = await jobCardService.getById(id);
    const data = await jobCardService.updateStatus(id, body.status);
    await appendActivity({
      entityType: "job_card",
      entityId: id,
      userId: user.sub,
      action: "status_changed",
      summary: `স্ট্যাটাস ${jobStatusBn[before.status] ?? before.status} → ${jobStatusBn[body.status] ?? body.status}`,
      meta: { jobNo: data.jobNo, from: before.status, to: body.status },
    });
    return success(c, data, "স্ট্যাটাস পরিবর্তন হয়েছে");
  },
  async remove(c: Context) {
    const user = c.get("user");
    const id = c.req.param("id") as string;
    const row = await jobCardService.delete(id);
    await appendActivity({
      entityType: "job_card",
      entityId: id,
      userId: user.sub,
      action: "deleted",
      summary: `জব কার্ড ${row.jobNo} মুছে ফেলা হয়েছে`,
      meta: { jobNo: row.jobNo },
    });
    return success(c, { id }, "জব কার্ড মুছে ফেলা হয়েছে");
  },
};
