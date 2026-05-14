import { pgTable, text, timestamp, uuid, numeric, date, index } from "drizzle-orm/pg-core";

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    category: text("category").notNull().default("misc"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    expenseDate: date("expense_date").notNull().defaultNow(),
    paymentMethod: text("payment_method").default("cash"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    dateIdx: index("expenses_date_idx").on(table.expenseDate),
    categoryIdx: index("expenses_category_idx").on(table.category),
  })
);

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
