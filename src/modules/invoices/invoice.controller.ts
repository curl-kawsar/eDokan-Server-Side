import type { Context } from "hono";
import { z } from "zod";
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
    const body = await c.req.json();
    const data = await invoiceService.create(body);
    return created(c, data, "ইনভয়েস সফলভাবে তৈরি হয়েছে");
  },
  async update(c: Context) {
    const body = await c.req.json();
    const data = await invoiceService.update(c.req.param("id") as string, body);
    return success(c, data, "ইনভয়েস আপডেট হয়েছে");
  },
  async remove(c: Context) {
    const id = c.req.param("id") as string;
    await invoiceService.delete(id);
    return success(c, { id }, "ইনভয়েস মুছে ফেলা হয়েছে");
  },
  async addPayment(c: Context) {
    const id = c.req.param("id") as string;
    const body = await c.req.json();
    const data = await invoiceService.addPayment(id, body);
    return created(c, data, "পেমেন্ট গৃহীত হয়েছে");
  },
  async cancel(c: Context) {
    const id = c.req.param("id") as string;
    const data = await invoiceService.cancel(id);
    return success(c, data, "ইনভয়েস বাতিল হয়েছে");
  },
};
