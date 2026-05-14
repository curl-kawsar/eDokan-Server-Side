import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { invoices, payments } from "@/db/schema/invoices";
import { NotFoundError, BadRequestError } from "@/utils/errors";
import type { PaginationParams } from "@/utils/pagination";
import { getOffset } from "@/utils/pagination";
import { generateDocumentNumber } from "@/utils/sequence";
import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  CreatePaymentInput,
} from "./invoice.schema";

function toStr(n: number) {
  return n.toString();
}

async function generateInvoiceNo(): Promise<string> {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(invoices);
  return generateDocumentNumber("INV", (count ?? 0) + 1);
}

function computeStatus(total: number, paidAmount: number): "unpaid" | "partial" | "paid" {
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount >= total) return "paid";
  return "partial";
}

export const invoiceService = {
  async list(params: PaginationParams & { status?: string; customerId?: string }) {
    const { page, limit, search, sortOrder, status, customerId } = params;
    const conditions = [];
    if (search) conditions.push(ilike(invoices.invoiceNo, `%${search}%`));
    if (status) conditions.push(eq(invoices.status, status as any));
    if (customerId) conditions.push(eq(invoices.customerId, customerId));
    const where = conditions.length ? and(...conditions) : undefined;
    const orderFn = sortOrder === "asc" ? asc : desc;

    const [rows, totalRow] = await Promise.all([
      db.query.invoices.findMany({
        where,
        with: {
          customer: true,
          jobCard: { with: { vehicle: true, items: true } },
          payments: true,
        },
        orderBy: [orderFn(invoices.createdAt)],
        limit,
        offset: getOffset(page, limit),
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(invoices).where(where),
    ]);

    return { rows, total: totalRow[0]?.count ?? 0 };
  },

  async getById(id: string) {
    const inv = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
      with: {
        customer: true,
        jobCard: { with: { vehicle: true, items: { with: { part: true } } } },
        payments: true,
      },
    });
    if (!inv) throw new NotFoundError("ইনভয়েস");
    return inv;
  },

  async create(input: CreateInvoiceInput) {
    const invoiceNo = await generateInvoiceNo();
    const total = input.total;
    const dueAmount = total;
    const [row] = await db
      .insert(invoices)
      .values({
        invoiceNo,
        customerId: input.customerId,
        jobCardId: input.jobCardId || null,
        issueDate: input.issueDate || new Date().toISOString().split("T")[0],
        dueDate: input.dueDate || null,
        subtotal: toStr(input.subtotal),
        discount: toStr(input.discount),
        tax: toStr(input.tax),
        total: toStr(total),
        paidAmount: "0",
        dueAmount: toStr(dueAmount),
        status: "unpaid",
        notes: input.notes ?? null,
      })
      .returning();
    return this.getById(row.id);
  },

  async update(id: string, input: UpdateInvoiceInput) {
    const inv = await db.query.invoices.findFirst({ where: eq(invoices.id, id) });
    if (!inv) throw new NotFoundError("ইনভয়েস");

    const data: Record<string, any> = { updatedAt: new Date() };
    if (input.customerId) data.customerId = input.customerId;
    if (input.jobCardId !== undefined) data.jobCardId = input.jobCardId || null;
    if (input.issueDate) data.issueDate = input.issueDate;
    if (input.dueDate !== undefined) data.dueDate = input.dueDate || null;
    if (input.subtotal !== undefined) data.subtotal = toStr(input.subtotal);
    if (input.discount !== undefined) data.discount = toStr(input.discount);
    if (input.tax !== undefined) data.tax = toStr(input.tax);
    if (input.total !== undefined) {
      data.total = toStr(input.total);
      const paid = Number(inv.paidAmount);
      data.dueAmount = toStr(Math.max(0, input.total - paid));
      data.status = computeStatus(input.total, paid);
    }
    if (input.notes !== undefined) data.notes = input.notes;

    const [row] = await db.update(invoices).set(data).where(eq(invoices.id, id)).returning();
    return this.getById(row.id);
  },

  async delete(id: string) {
    const [row] = await db.delete(invoices).where(eq(invoices.id, id)).returning();
    if (!row) throw new NotFoundError("ইনভয়েস");
    return row;
  },

  async addPayment(invoiceId: string, input: CreatePaymentInput) {
    const inv = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
    if (!inv) throw new NotFoundError("ইনভয়েস");
    if (inv.status === "cancelled") throw new BadRequestError("বাতিল হওয়া ইনভয়েসে পেমেন্ট করা যাবে না");

    const due = Number(inv.dueAmount);
    if (input.amount > due + 0.001) {
      throw new BadRequestError(`পেমেন্টের পরিমাণ বকেয়া (${due}) এর চেয়ে বেশি হতে পারবে না`);
    }

    await db.insert(payments).values({
      invoiceId,
      amount: toStr(input.amount),
      method: input.method,
      transactionRef: input.transactionRef ?? null,
      paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
      notes: input.notes ?? null,
    });

    const newPaid = Number(inv.paidAmount) + input.amount;
    const newDue = Number(inv.total) - newPaid;

    await db
      .update(invoices)
      .set({
        paidAmount: toStr(newPaid),
        dueAmount: toStr(Math.max(0, newDue)),
        status: computeStatus(Number(inv.total), newPaid),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    return this.getById(invoiceId);
  },

  async cancel(id: string) {
    const [row] = await db
      .update(invoices)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    if (!row) throw new NotFoundError("ইনভয়েস");
    return this.getById(id);
  },
};
