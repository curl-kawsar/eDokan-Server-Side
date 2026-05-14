import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { suppliers } from "@/db/schema/suppliers";
import { NotFoundError } from "@/utils/errors";
import type { PaginationParams } from "@/utils/pagination";
import { getOffset } from "@/utils/pagination";
import type { CreateSupplierInput, UpdateSupplierInput } from "./supplier.schema";

function cleanInput(input: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === "") out[k] = null;
    else if (typeof v === "number") out[k] = v.toString();
    else out[k] = v;
  }
  return out;
}

export const supplierService = {
  async list(params: PaginationParams) {
    const { page, limit, search, sortOrder } = params;
    const where = search
      ? or(
          ilike(suppliers.name, `%${search}%`),
          ilike(suppliers.phone, `%${search}%`),
          ilike(suppliers.contactPerson, `%${search}%`)
        )
      : undefined;
    const orderFn = sortOrder === "asc" ? asc : desc;

    const [rows, totalRow] = await Promise.all([
      db
        .select()
        .from(suppliers)
        .where(where)
        .orderBy(orderFn(suppliers.createdAt))
        .limit(limit)
        .offset(getOffset(page, limit)),
      db.select({ count: sql<number>`count(*)::int` }).from(suppliers).where(where),
    ]);

    return { rows, total: totalRow[0]?.count ?? 0 };
  },

  async getById(id: string) {
    const supplier = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, id),
      with: { parts: true },
    });
    if (!supplier) throw new NotFoundError("সরবরাহকারী");
    return supplier;
  },

  async create(input: CreateSupplierInput) {
    const data = cleanInput(input);
    const [row] = await db.insert(suppliers).values(data as any).returning();
    return row;
  },

  async update(id: string, input: UpdateSupplierInput) {
    const data = cleanInput(input);
    const [row] = await db
      .update(suppliers)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(suppliers.id, id))
      .returning();
    if (!row) throw new NotFoundError("সরবরাহকারী");
    return row;
  },

  async delete(id: string) {
    const [row] = await db.delete(suppliers).where(eq(suppliers.id, id)).returning();
    if (!row) throw new NotFoundError("সরবরাহকারী");
    return row;
  },
};
