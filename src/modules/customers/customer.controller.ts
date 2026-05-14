import type { Context } from "hono";
import { customerService } from "./customer.service";
import { paginationSchema } from "@/utils/pagination";
import { success, created, paginated } from "@/utils/response";
import type { CreateCustomerInput, UpdateCustomerInput } from "./customer.schema";

export const customerController = {
  async list(c: Context) {
    const params = paginationSchema.parse(c.req.query());
    const { rows, total } = await customerService.list(params);
    return paginated(c, rows, { page: params.page, limit: params.limit, total });
  },

  async get(c: Context) {
    const id = c.req.param("id") as string;
    const data = await customerService.getById(id);
    return success(c, data);
  },

  async create(c: Context) {
    const body = (await c.req.json()) as CreateCustomerInput;
    const data = await customerService.create(body);
    return created(c, data, "গ্রাহক সফলভাবে যুক্ত হয়েছে");
  },

  async update(c: Context) {
    const id = c.req.param("id") as string;
    const body = (await c.req.json()) as UpdateCustomerInput;
    const data = await customerService.update(id, body);
    return success(c, data, "গ্রাহকের তথ্য আপডেট হয়েছে");
  },

  async remove(c: Context) {
    const id = c.req.param("id") as string;
    await customerService.delete(id);
    return success(c, { id }, "গ্রাহক মুছে ফেলা হয়েছে");
  },
};
