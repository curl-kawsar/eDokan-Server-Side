import { pgTable, text, timestamp, uuid, integer, numeric, index } from "drizzle-orm/pg-core";
import { suppliers } from "./suppliers";

export const parts = pgTable(
  "parts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    nameBn: text("name_bn"),
    category: text("category"),
    brand: text("brand"),
    unit: text("unit").notNull().default("pcs"),
    purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }).notNull().default("0"),
    sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }).notNull().default("0"),
    stockQty: integer("stock_qty").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
    supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    skuIdx: index("parts_sku_idx").on(table.sku),
    nameIdx: index("parts_name_idx").on(table.name),
    categoryIdx: index("parts_category_idx").on(table.category),
  })
);

export type Part = typeof parts.$inferSelect;
export type NewPart = typeof parts.$inferInsert;
