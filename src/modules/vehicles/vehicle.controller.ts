import type { Context } from "hono";
import { z } from "zod";
import { vehicleService } from "./vehicle.service";
import { paginationSchema } from "@/utils/pagination";
import { success, created, paginated } from "@/utils/response";
import type { CreateVehicleInput, UpdateVehicleInput } from "./vehicle.schema";

const listQuerySchema = paginationSchema.extend({
  customerId: z.string().uuid().optional(),
});

export const vehicleController = {
  async list(c: Context) {
    const params = listQuerySchema.parse(c.req.query());
    const { rows, total } = await vehicleService.list(params);
    return paginated(c, rows, { page: params.page, limit: params.limit, total });
  },

  async get(c: Context) {
    const data = await vehicleService.getById(c.req.param("id") as string);
    return success(c, data);
  },

  async create(c: Context) {
    const body = (await c.req.json()) as CreateVehicleInput;
    const data = await vehicleService.create(body);
    return created(c, data, "যানবাহন সফলভাবে যুক্ত হয়েছে");
  },

  async update(c: Context) {
    const body = (await c.req.json()) as UpdateVehicleInput;
    const data = await vehicleService.update(c.req.param("id") as string, body);
    return success(c, data, "যানবাহনের তথ্য আপডেট হয়েছে");
  },

  async remove(c: Context) {
    const id = c.req.param("id") as string;
    await vehicleService.delete(id);
    return success(c, { id }, "যানবাহন মুছে ফেলা হয়েছে");
  },
};
