import type { Context } from "hono";
import { z } from "zod";
import { appendActivity } from "@/modules/activity-logs/activity-log.service";
import { invoiceStatusBn, paymentMethodBn } from "@/modules/activity-logs/labels";
import { invoiceService } from "./invoice.service";
import { paginationSchema } from "@/utils/pagination";
import { success, created, paginated } from "@/utils/response";
import { invoiceStatusValues } from "./invoice.schema";

const listQuerySchema = paginationSchema.extend({
  status: z.enum(invoiceStatusValues).optional(),
  customerId: z.string().uuid().optional(),
});

export const invoiceController = {
  async list(c: Context) {
    const params = listQuerySchema.parse(c.req.query());
    const { rows, total } = await invoiceService.list(params);
    return paginated(c, rows, { page: params.page, limit: params.limit, total });
  },
  async get(c: Context) {
    const data = await invoiceService.getById(c.req.param("id") as string);
    return success(c, data);
  },
  async create(c: Context) {
    const user = c.get("user");
    const body = await c.req.json();
    const data = await invoiceService.create(body);
    await appendActivity({
      entityType: "invoice",
      entityId: data.id,
      userId: user.sub,
      action: "created",
      summary: `ইনভয়েস ${data.invoiceNo} তৈরি (${invoiceStatusBn[data.status] ?? data.status})`,
      meta: { invoiceNo: data.invoiceNo, status: data.status, total: data.total },
    });
    return created(c, data, "ইনভয়েস সফলভাবে তৈরি হয়েছে");
  },
  async update(c: Context) {
    const user = c.get("user");
    const id = c.req.param("id") as string;
    const body = await c.req.json();
    const before = await invoiceService.getById(id);
    const data = await invoiceService.update(id, body);
    const keys = Object.keys(body).filter((k) => body[k as keyof typeof body] !== undefined);
    let summary = `ইনভয়েস ${data.invoiceNo} আপডেট`;
    if (before.status !== data.status) {
      summary = `স্ট্যাটাস ${invoiceStatusBn[before.status] ?? before.status} → ${invoiceStatusBn[data.status] ?? data.status}`;
    }
    await appendActivity({
      entityType: "invoice",
      entityId: id,
      userId: user.sub,
      action: "updated",
      summary,
      meta: {
        invoiceNo: data.invoiceNo,
        keys,
        status: before.status !== data.status ? { from: before.status, to: data.status } : undefined,
      },
    });
    return success(c, data, "ইনভয়েস আপডেট হয়েছে");
  },
  async remove(c: Context) {
    const user = c.get("user");
    const id = c.req.param("id") as string;
    const row = await invoiceService.delete(id);
    await appendActivity({
      entityType: "invoice",
      entityId: id,
      userId: user.sub,
      action: "deleted",
      summary: `ইনভয়েস ${row.invoiceNo} মুছে ফেলা হয়েছে`,
      meta: { invoiceNo: row.invoiceNo },
    });
    return success(c, { id }, "ইনভয়েস মুছে ফেলা হয়েছে");
  },
  async addPayment(c: Context) {
    const user = c.get("user");
    const id = c.req.param("id") as string;
    const body = await c.req.json();
    const data = await invoiceService.addPayment(id, body);
    await appendActivity({
      entityType: "invoice",
      entityId: id,
      userId: user.sub,
      action: "payment_received",
      summary: `পেমেন্ট ${body.amount} টাকা (${paymentMethodBn[body.method] ?? body.method})`,
      meta: {
        invoiceNo: data.invoiceNo,
        amount: body.amount,
        method: body.method,
        newStatus: data.status,
        paidAmount: data.paidAmount,
      },
    });
    return created(c, data, "পেমেন্ট গৃহীত হয়েছে");
  },
  async cancel(c: Context) {
    const user = c.get("user");
    const id = c.req.param("id") as string;
    const data = await invoiceService.cancel(id);
    await appendActivity({
      entityType: "invoice",
      entityId: id,
      userId: user.sub,
      action: "cancelled",
      summary: `ইনভয়েস ${data.invoiceNo} বাতিল`,
      meta: { invoiceNo: data.invoiceNo },
    });
    return success(c, data, "ইনভয়েস বাতিল হয়েছে");
  },
};
