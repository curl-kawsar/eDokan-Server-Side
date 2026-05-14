import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { parts } from "@/db/schema/parts";
import { NotFoundError, BadRequestError } from "@/utils/errors";
import type { PaginationParams } from "@/utils/pagination";
import { getOffset } from "@/utils/pagination";
import type { CreatePartInput, UpdatePartInput, StockAdjustmentInput } from "./part.schema";

function cleanInput(input: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === "") out[k] = null;
    else if (typeof v === "number") out[k] = v.toString();
    else out[k] = v;
  }
  return out;
}

export const partService = {
  async list(params: PaginationParams & { lowStock?: boolean }) {
    const { page, limit, search, sortOrder, lowStock } = params;
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(parts.name, `%${search}%`),
          ilike(parts.sku, `%${search}%`),
          ilike(parts.brand, `%${search}%`),
          ilike(parts.category, `%${search}%`)
        )!
      );
    }
    if (lowStock) {
      conditions.push(sql`${parts.stockQty} <= ${parts.lowStockThreshold}`);
    }
    const where = conditions.length ? and(...conditions) : undefined;
    const orderFn = sortOrder === "asc" ? asc : desc;

    const [rows, totalRow] = await Promise.all([
      db.query.parts.findMany({
        where,
        with: { supplier: true },
        orderBy: [orderFn(parts.createdAt)],
        limit,
        offset: getOffset(page, limit),
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(parts).where(where),
    ]);

    return { rows, total: totalRow[0]?.count ?? 0 };
  },

  async getById(id: string) {
    const part = await db.query.parts.findFirst({
      where: eq(parts.id, id),
      with: { supplier: true },
    });
    if (!part) throw new NotFoundError("পার্টস");
    return part;
  },

  async create(input: CreatePartInput) {
    const data = cleanInput(input);
    const [row] = await db.insert(parts).values(data as any).returning();
    return row;
  },

  async update(id: string, input: UpdatePartInput) {
    const data = cleanInput(input);
    const [row] = await db
      .update(parts)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(parts.id, id))
      .returning();
    if (!row) throw new NotFoundError("পার্টস");
    return row;
  },

  async delete(id: string) {
    const [row] = await db.delete(parts).where(eq(parts.id, id)).returning();
    if (!row) throw new NotFoundError("পার্টস");
    return row;
  },

  async adjustStock(id: string, input: StockAdjustmentInput) {
    const part = await db.query.parts.findFirst({ where: eq(parts.id, id) });
    if (!part) throw new NotFoundError("পার্টস");
    const newQty = part.stockQty + input.quantity;
    if (newQty < 0) throw new BadRequestError("পর্যাপ্ত স্টক নেই");
    const [row] = await db
      .update(parts)
      .set({ stockQty: newQty, updatedAt: new Date() })
      .where(eq(parts.id, id))
      .returning();
    return row;
  },
};
