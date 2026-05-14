import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { vehicles } from "@/db/schema/vehicles";
import { customers } from "@/db/schema/customers";
import { NotFoundError } from "@/utils/errors";
import type { PaginationParams } from "@/utils/pagination";
import { getOffset } from "@/utils/pagination";
import type { CreateVehicleInput, UpdateVehicleInput } from "./vehicle.schema";

function cleanInput<T extends Record<string, any>>(input: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === "") out[k] = null;
    else out[k] = v;
  }
  return out as T;
}

export const vehicleService = {
  async list(params: PaginationParams & { customerId?: string }) {
    const { page, limit, search, sortOrder, customerId } = params;
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(vehicles.registrationNo, `%${search}%`),
          ilike(vehicles.brand, `%${search}%`),
          ilike(vehicles.model, `%${search}%`),
          ilike(vehicles.chassisNo, `%${search}%`)
        )!
      );
    }
    if (customerId) conditions.push(eq(vehicles.customerId, customerId));
    const where = conditions.length ? and(...conditions) : undefined;

    const orderFn = sortOrder === "asc" ? asc : desc;

    const [rows, totalRow] = await Promise.all([
      db.query.vehicles.findMany({
        where,
        with: { customer: true },
        orderBy: [orderFn(vehicles.createdAt)],
        limit,
        offset: getOffset(page, limit),
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(vehicles).where(where),
    ]);

    return { rows, total: totalRow[0]?.count ?? 0 };
  },

  async getById(id: string) {
    const vehicle = await db.query.vehicles.findFirst({
      where: eq(vehicles.id, id),
      with: { customer: true },
    });
    if (!vehicle) throw new NotFoundError("যানবাহন");
    return vehicle;
  },

  async create(input: CreateVehicleInput) {
    const data = cleanInput(input);
    const [row] = await db.insert(vehicles).values(data).returning();
    return row;
  },

  async update(id: string, input: UpdateVehicleInput) {
    const data = cleanInput(input);
    const [row] = await db
      .update(vehicles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning();
    if (!row) throw new NotFoundError("যানবাহন");
    return row;
  },

  async delete(id: string) {
    const [row] = await db.delete(vehicles).where(eq(vehicles.id, id)).returning();
    if (!row) throw new NotFoundError("যানবাহন");
    return row;
  },
};
