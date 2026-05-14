import { sql, gte, lte, and } from "drizzle-orm";
import { db } from "@/config/db";
import { payments, invoices } from "@/db/schema/invoices";
import { expenses } from "@/db/schema/expenses";
import { jobCardItems } from "@/db/schema/job-cards";

function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]!;
}

function today(): string {
  return new Date().toISOString().split("T")[0]!;
}

export const reportService = {
  async summary(from?: string, to?: string) {
    const start = from || startOfMonth();
    const end = to || today();

    const [revenueRow, expenseRow, dueRow, invoiceCountRow] = await Promise.all([
      db
        .select({ total: sql<string>`coalesce(sum(${payments.amount}),0)::text` })
        .from(payments)
        .where(
          and(
            sql`${payments.paidAt}::date >= ${start}`,
            sql`${payments.paidAt}::date <= ${end}`
          )
        ),
      db
        .select({ total: sql<string>`coalesce(sum(${expenses.amount}),0)::text` })
        .from(expenses)
        .where(and(gte(expenses.expenseDate, start), lte(expenses.expenseDate, end))),
      db
        .select({ total: sql<string>`coalesce(sum(${invoices.dueAmount}),0)::text` })
        .from(invoices)
        .where(sql`${invoices.status} != 'cancelled'`),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(invoices)
        .where(
          and(
            gte(invoices.issueDate, start),
            lte(invoices.issueDate, end),
            sql`${invoices.status} != 'cancelled'`
          )
        ),
    ]);

    const revenue = Number(revenueRow[0]?.total ?? 0);
    const expense = Number(expenseRow[0]?.total ?? 0);
    const profit = revenue - expense;
    const totalDue = Number(dueRow[0]?.total ?? 0);
    const invoiceCount = invoiceCountRow[0]?.count ?? 0;

    return {
      range: { from: start, to: end },
      revenue,
      expense,
      profit,
      totalDue,
      invoiceCount,
    };
  },

  async revenueSeries(from: string, to: string) {
    const rows = await db
      .select({
        date: sql<string>`to_char(${payments.paidAt}::date, 'YYYY-MM-DD')`,
        total: sql<string>`coalesce(sum(${payments.amount}),0)::text`,
      })
      .from(payments)
      .where(
        and(
          sql`${payments.paidAt}::date >= ${from}`,
          sql`${payments.paidAt}::date <= ${to}`
        )
      )
      .groupBy(sql`${payments.paidAt}::date`)
      .orderBy(sql`${payments.paidAt}::date`);
    return rows.map((r) => ({ date: r.date, total: Number(r.total) }));
  },

  async topCustomers(from: string, to: string, limit = 5) {
    const rows = await db.execute(sql`
      select c.id, c.name, c.phone,
             coalesce(sum(p.amount), 0)::text as paid,
             count(distinct i.id)::int as invoice_count
      from customers c
      join invoices i on i.customer_id = c.id
      left join payments p on p.invoice_id = i.id
        and p.paid_at::date >= ${from} and p.paid_at::date <= ${to}
      where i.issue_date >= ${from} and i.issue_date <= ${to}
        and i.status != 'cancelled'
      group by c.id, c.name, c.phone
      order by paid desc
      limit ${limit}
    `);
    return (rows.rows as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      phone: String(r.phone),
      paid: Number(r.paid),
      invoiceCount: Number(r.invoice_count),
    }));
  },

  async topParts(from: string, to: string, limit = 5) {
    const rows = await db.execute(sql`
      select ji.name,
             sum(ji.quantity)::int as qty,
             sum(ji.total)::text as revenue
      from job_card_items ji
      join job_cards jc on jc.id = ji.job_card_id
      where jc.received_date >= ${from} and jc.received_date <= ${to}
      group by ji.name
      order by qty desc
      limit ${limit}
    `);
    return (rows.rows as Array<Record<string, unknown>>).map((r) => ({
      name: String(r.name),
      qty: Number(r.qty),
      revenue: Number(r.revenue),
    }));
  },
};
