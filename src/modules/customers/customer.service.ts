import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { customers } from "@/db/schema/customers";
import { vehicles } from "@/db/schema/vehicles";
import { NotFoundError } from "@/utils/errors";
import type { PaginationParams } from "@/utils/pagination";
import { getOffset } from "@/utils/pagination";
import type { CreateCustomerInput, UpdateCustomerInput } from "./customer.schema";

function cleanInput<T extends Record<string, any>>(input: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === "") out[k] = null;
    else out[k] = v;
  }
  return out as T;
}

export const customerService = {
  async list(params: PaginationParams) {
    const { page, limit, search, sortBy, sortOrder } = params;
    const where = search
      ? or(
          ilike(customers.name, `%${search}%`),
          ilike(customers.phone, `%${search}%`),
          ilike(customers.email, `%${search}%`)
        )
      : undefined;

    const orderColumn =
      sortBy === "name"
        ? customers.name
        : sortBy === "phone"
          ? customers.phone
          : customers.createdAt;
    const orderFn = sortOrder === "asc" ? asc : desc;

    const [rows, totalRow] = await Promise.all([
      db
        .select()
        .from(customers)
        .where(where)
        .orderBy(orderFn(orderColumn))
        .limit(limit)
        .offset(getOffset(page, limit)),
      db.select({ count: sql<number>`count(*)::int` }).from(customers).where(where),
    ]);

    return { rows, total: totalRow[0]?.count ?? 0 };
  },

  async getById(id: string) {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, id),
      with: { vehicles: true },
    });
    if (!customer) throw new NotFoundError("গ্রাহক");
    return customer;
  },

  async create(input: CreateCustomerInput) {
    const data = cleanInput(input);
    const [row] = await db.insert(customers).values(data).returning();
    return row;
  },

  async update(id: string, input: UpdateCustomerInput) {
    const data = cleanInput(input);
    const [row] = await db
      .update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    if (!row) throw new NotFoundError("গ্রাহক");
    return row;
  },

  async delete(id: string) {
    const [row] = await db.delete(customers).where(eq(customers.id, id)).returning();
    if (!row) throw new NotFoundError("গ্রাহক");
    return row;
  },
};
