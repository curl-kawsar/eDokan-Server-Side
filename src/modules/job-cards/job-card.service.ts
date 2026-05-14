import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { jobCards, jobCardItems } from "@/db/schema/job-cards";
import { parts } from "@/db/schema/parts";
import { NotFoundError } from "@/utils/errors";
import type { PaginationParams } from "@/utils/pagination";
import { getOffset } from "@/utils/pagination";
import { generateDocumentNumber } from "@/utils/sequence";
import type {
  CreateJobCardInput,
  UpdateJobCardInput,
} from "./job-card.schema";

function cleanInput(input: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === "") out[k] = null;
    else if (typeof v === "number") out[k] = v.toString();
    else out[k] = v;
  }
  return out;
}

async function generateJobNo(): Promise<string> {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(jobCards);
  return generateDocumentNumber("JOB", (count ?? 0) + 1);
}

export const jobCardService = {
  async list(params: PaginationParams & { status?: string; customerId?: string }) {
    const { page, limit, search, sortOrder, status, customerId } = params;
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(jobCards.jobNo, `%${search}%`),
          ilike(jobCards.complaint, `%${search}%`),
          ilike(jobCards.diagnosis, `%${search}%`)
        )!
      );
    }
    if (status) conditions.push(eq(jobCards.status, status as any));
    if (customerId) conditions.push(eq(jobCards.customerId, customerId));
    const where = conditions.length ? and(...conditions) : undefined;
    const orderFn = sortOrder === "asc" ? asc : desc;

    const [rows, totalRow] = await Promise.all([
      db.query.jobCards.findMany({
        where,
        with: { customer: true, vehicle: true, assignedTo: true, items: true },
        orderBy: [orderFn(jobCards.createdAt)],
        limit,
        offset: getOffset(page, limit),
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(jobCards).where(where),
    ]);

    return { rows: rows.map(formatJobCard), total: totalRow[0]?.count ?? 0 };
  },

  async getById(id: string) {
    const jc = await db.query.jobCards.findFirst({
      where: eq(jobCards.id, id),
      with: {
        customer: true,
        vehicle: true,
        assignedTo: { columns: { id: true, name: true, email: true, role: true } },
        items: { with: { part: true } },
        invoices: true,
      },
    });
    if (!jc) throw new NotFoundError("জব কার্ড");
    return formatJobCard(jc);
  },

  async create(input: CreateJobCardInput) {
    const { items = [], ...rest } = input;
    const cleaned = cleanInput(rest);
    const jobNo = await generateJobNo();

    const [created] = await db
      .insert(jobCards)
      .values({ ...cleaned, jobNo } as any)
      .returning();

    if (items.length) {
      const itemRows = items.map((it) => ({
        jobCardId: created.id,
        partId: it.partId || null,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice.toString(),
        total: (it.unitPrice * it.quantity).toString(),
      }));
      await db.insert(jobCardItems).values(itemRows);

      for (const it of items) {
        if (it.partId) {
          const part = await db.query.parts.findFirst({ where: eq(parts.id, it.partId) });
          if (part) {
            const newQty = Math.max(0, part.stockQty - it.quantity);
            await db.update(parts).set({ stockQty: newQty }).where(eq(parts.id, it.partId));
          }
        }
      }
    }

    return this.getById(created.id);
  },

  async update(id: string, input: UpdateJobCardInput) {
    const { items, ...rest } = input;
    const cleaned = cleanInput(rest);

    const [row] = await db
      .update(jobCards)
      .set({ ...cleaned, updatedAt: new Date() } as any)
      .where(eq(jobCards.id, id))
      .returning();
    if (!row) throw new NotFoundError("জব কার্ড");

    if (items) {
      const existing = await db.query.jobCardItems.findMany({
        where: eq(jobCardItems.jobCardId, id),
      });
      for (const ex of existing) {
        if (ex.partId) {
          const part = await db.query.parts.findFirst({ where: eq(parts.id, ex.partId) });
          if (part) {
            await db
              .update(parts)
              .set({ stockQty: part.stockQty + ex.quantity })
              .where(eq(parts.id, ex.partId));
          }
        }
      }

      await db.delete(jobCardItems).where(eq(jobCardItems.jobCardId, id));

      if (items.length) {
        const itemRows = items.map((it) => ({
          jobCardId: id,
          partId: it.partId || null,
          name: it.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice.toString(),
          total: (it.unitPrice * it.quantity).toString(),
        }));
        await db.insert(jobCardItems).values(itemRows);

        for (const it of items) {
          if (it.partId) {
            const part = await db.query.parts.findFirst({ where: eq(parts.id, it.partId) });
            if (part) {
              const newQty = Math.max(0, part.stockQty - it.quantity);
              await db.update(parts).set({ stockQty: newQty }).where(eq(parts.id, it.partId));
            }
          }
        }
      }
    }

    return this.getById(id);
  },

  async updateStatus(id: string, status: string) {
    const updates: Record<string, any> = { status, updatedAt: new Date() };
    if (status === "delivered") {
      updates.deliveredDate = new Date().toISOString().split("T")[0];
    }
    const [row] = await db.update(jobCards).set(updates).where(eq(jobCards.id, id)).returning();
    if (!row) throw new NotFoundError("জব কার্ড");
    return this.getById(id);
  },

  async delete(id: string) {
    const [row] = await db.delete(jobCards).where(eq(jobCards.id, id)).returning();
    if (!row) throw new NotFoundError("জব কার্ড");
    return row;
  },
};

function formatJobCard(jc: any) {
  const items = jc.items ?? [];
  const partsTotal = items.reduce(
    (sum: number, it: any) => sum + Number(it.unitPrice) * it.quantity,
    0
  );
  const laborCost = Number(jc.laborCost ?? 0);
  const discount = Number(jc.discount ?? 0);
  const subtotal = partsTotal + laborCost;
  const total = subtotal - discount;
  return {
    ...jc,
    partsTotal,
    laborCost,
    discount,
    subtotal,
    total,
  };
}
