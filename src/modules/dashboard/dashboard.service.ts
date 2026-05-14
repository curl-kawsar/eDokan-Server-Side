import { sql, and, gte, lte, eq } from "drizzle-orm";
import { db } from "@/config/db";
import { customers } from "@/db/schema/customers";
import { vehicles } from "@/db/schema/vehicles";
import { parts } from "@/db/schema/parts";
import { jobCards } from "@/db/schema/job-cards";
import { invoices, payments } from "@/db/schema/invoices";
import { expenses } from "@/db/schema/expenses";

function lastNDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export const dashboardService = {
  async getStats() {
    const today = new Date().toISOString().split("T")[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const [
      [customerCount],
      [vehicleCount],
      [partsCount],
      [lowStockCount],
      [pendingJobs],
      [inProgressJobs],
      [completedJobs],
      [todayRevenueRow],
      [monthRevenueRow],
      [todayExpenseRow],
      [monthExpenseRow],
      [totalDueRow],
    ] = await Promise.all([
      db.select({ c: sql<number>`count(*)::int` }).from(customers),
      db.select({ c: sql<number>`count(*)::int` }).from(vehicles),
      db.select({ c: sql<number>`count(*)::int` }).from(parts),
      db
        .select({ c: sql<number>`count(*)::int` })
        .from(parts)
        .where(sql`${parts.stockQty} <= ${parts.lowStockThreshold}`),
      db
        .select({ c: sql<number>`count(*)::int` })
        .from(jobCards)
        .where(eq(jobCards.status, "pending")),
      db
        .select({ c: sql<number>`count(*)::int` })
        .from(jobCards)
        .where(eq(jobCards.status, "in_progress")),
      db
        .select({ c: sql<number>`count(*)::int` })
        .from(jobCards)
        .where(eq(jobCards.status, "completed")),
      db
        .select({ total: sql<string>`coalesce(sum(${payments.amount}),0)::text` })
        .from(payments)
        .where(sql`date(${payments.paidAt}) = ${today}`),
      db
        .select({ total: sql<string>`coalesce(sum(${payments.amount}),0)::text` })
        .from(payments)
        .where(sql`date(${payments.paidAt}) >= ${startOfMonth}`),
      db
        .select({ total: sql<string>`coalesce(sum(${expenses.amount}),0)::text` })
        .from(expenses)
        .where(eq(expenses.expenseDate, today)),
      db
        .select({ total: sql<string>`coalesce(sum(${expenses.amount}),0)::text` })
        .from(expenses)
        .where(gte(expenses.expenseDate, startOfMonth)),
      db
        .select({ total: sql<string>`coalesce(sum(${invoices.dueAmount}),0)::text` })
        .from(invoices)
        .where(sql`${invoices.status} != 'cancelled'`),
    ]);

    return {
      counts: {
        customers: customerCount.c,
        vehicles: vehicleCount.c,
        parts: partsCount.c,
        lowStock: lowStockCount.c,
        pendingJobs: pendingJobs.c,
        inProgressJobs: inProgressJobs.c,
        completedJobs: completedJobs.c,
      },
      finance: {
        todayRevenue: Number(todayRevenueRow.total),
        monthRevenue: Number(monthRevenueRow.total),
        todayExpense: Number(todayExpenseRow.total),
        monthExpense: Number(monthExpenseRow.total),
        totalDue: Number(totalDueRow.total),
      },
    };
  },

  async getRevenueSeries(days = 14) {
    const start = lastNDays(days - 1);
    const rows = await db
      .select({
        date: sql<string>`to_char(${payments.paidAt}::date, 'YYYY-MM-DD')`,
        total: sql<string>`coalesce(sum(${payments.amount}),0)::text`,
      })
      .from(payments)
      .where(sql`${payments.paidAt}::date >= ${start}`)
      .groupBy(sql`${payments.paidAt}::date`)
      .orderBy(sql`${payments.paidAt}::date`);

    const map = new Map(rows.map((r) => [r.date, Number(r.total)]));
    const series: { date: string; total: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      series.push({ date: key, total: map.get(key) ?? 0 });
    }
    return series;
  },

  async getRecentJobs(limit = 5) {
    return await db.query.jobCards.findMany({
      with: { customer: true, vehicle: true },
      orderBy: (j, { desc }) => [desc(j.createdAt)],
      limit,
    });
  },

  async getLowStockParts(limit = 5) {
    return await db.query.parts.findMany({
      where: sql`${parts.stockQty} <= ${parts.lowStockThreshold}`,
      orderBy: (p, { asc }) => [asc(p.stockQty)],
      limit,
    });
  },
};
