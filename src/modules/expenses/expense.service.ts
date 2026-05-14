import { and, asc, desc, eq, ilike, or, sql, gte, lte } from "drizzle-orm";
import { db } from "@/config/db";
import { expenses } from "@/db/schema/expenses";
import { NotFoundError } from "@/utils/errors";
import type { PaginationParams } from "@/utils/pagination";
import { getOffset } from "@/utils/pagination";
import type { CreateExpenseInput, UpdateExpenseInput } from "./expense.schema";

function toStr(n: number) {
  return n.toString();
}

export const expenseService = {
  async list(
    params: PaginationParams & { category?: string; from?: string; to?: string }
  ) {
    const { page, limit, search, sortOrder, category, from, to } = params;
    const conditions = [];
    if (search) {
      conditions.push(
        or(ilike(expenses.title, `%${search}%`), ilike(expenses.notes, `%${search}%`))!
      );
    }
    if (category) conditions.push(eq(expenses.category, category));
    if (from) conditions.push(gte(expenses.expenseDate, from));
    if (to) conditions.push(lte(expenses.expenseDate, to));
    const where = conditions.length ? and(...conditions) : undefined;
    const orderFn = sortOrder === "asc" ? asc : desc;

    const [rows, totalRow] = await Promise.all([
      db
        .select()
        .from(expenses)
        .where(where)
        .orderBy(orderFn(expenses.expenseDate))
        .limit(limit)
        .offset(getOffset(page, limit)),
      db.select({ count: sql<number>`count(*)::int` }).from(expenses).where(where),
    ]);

    return { rows, total: totalRow[0]?.count ?? 0 };
  },

  async getById(id: string) {
    const exp = await db.query.expenses.findFirst({ where: eq(expenses.id, id) });
    if (!exp) throw new NotFoundError("খরচ");
    return exp;
  },

  async create(input: CreateExpenseInput) {
    const [row] = await db
      .insert(expenses)
      .values({
        title: input.title,
        category: input.category,
        amount: toStr(input.amount),
        expenseDate: input.expenseDate || new Date().toISOString().split("T")[0],
        paymentMethod: input.paymentMethod ?? null,
        notes: input.notes ?? null,
      })
      .returning();
    return row;
  },

  async update(id: string, input: UpdateExpenseInput) {
    const data: Record<string, any> = { updatedAt: new Date() };
    if (input.title !== undefined) data.title = input.title;
    if (input.category !== undefined) data.category = input.category;
    if (input.amount !== undefined) data.amount = toStr(input.amount);
    if (input.expenseDate !== undefined) data.expenseDate = input.expenseDate;
    if (input.paymentMethod !== undefined) data.paymentMethod = input.paymentMethod;
    if (input.notes !== undefined) data.notes = input.notes;

    const [row] = await db.update(expenses).set(data).where(eq(expenses.id, id)).returning();
    if (!row) throw new NotFoundError("খরচ");
    return row;
  },

  async delete(id: string) {
    const [row] = await db.delete(expenses).where(eq(expenses.id, id)).returning();
    if (!row) throw new NotFoundError("খরচ");
    return row;
  },
};
