import { pgTable, text, timestamp, uuid, index, numeric } from "drizzle-orm/pg-core";

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    contactPerson: text("contact_person"),
    phone: text("phone").notNull(),
    altPhone: text("alt_phone"),
    email: text("email"),
    address: text("address"),
    openingBalance: numeric("opening_balance", { precision: 12, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: index("suppliers_name_idx").on(table.name),
    phoneIdx: index("suppliers_phone_idx").on(table.phone),
  })
);

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
