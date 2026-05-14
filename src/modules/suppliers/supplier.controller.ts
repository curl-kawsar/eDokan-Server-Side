import type { Context } from "hono";
import { supplierService } from "./supplier.service";
import { paginationSchema } from "@/utils/pagination";
import { success, created, paginated } from "@/utils/response";

export const supplierController = {
  async list(c: Context) {
    const params = paginationSchema.parse(c.req.query());
    const { rows, total } = await supplierService.list(params);
    return paginated(c, rows, { page: params.page, limit: params.limit, total });
  },
  async get(c: Context) {
    const data = await supplierService.getById(c.req.param("id") as string);
    return success(c, data);
  },
  async create(c: Context) {
    const body = await c.req.json();
    const data = await supplierService.create(body);
    return created(c, data, "সরবরাহকারী যুক্ত হয়েছে");
  },
  async update(c: Context) {
    const body = await c.req.json();
    const data = await supplierService.update(c.req.param("id") as string, body);
    return success(c, data, "সরবরাহকারীর তথ্য আপডেট হয়েছে");
  },
  async remove(c: Context) {
    const id = c.req.param("id") as string;
    await supplierService.delete(id);
    return success(c, { id }, "সরবরাহকারী মুছে ফেলা হয়েছে");
  },
};
