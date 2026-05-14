import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  integer,
  numeric,
  index,
  date,
} from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { vehicles } from "./vehicles";
import { parts } from "./parts";
import { users } from "./users";

export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "in_progress",
  "completed",
  "delivered",
  "cancelled",
]);

export const jobCards = pgTable(
  "job_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobNo: text("job_no").notNull().unique(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "restrict" }),
    assignedToId: uuid("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
    status: jobStatusEnum("status").notNull().default("pending"),
    complaint: text("complaint"),
    diagnosis: text("diagnosis"),
    workDone: text("work_done"),
    mileageIn: integer("mileage_in"),
    laborCost: numeric("labor_cost", { precision: 12, scale: 2 }).notNull().default("0"),
    discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"),
    receivedDate: date("received_date").notNull().defaultNow(),
    expectedDeliveryDate: date("expected_delivery_date"),
    deliveredDate: date("delivered_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    jobNoIdx: index("job_cards_job_no_idx").on(table.jobNo),
    customerIdx: index("job_cards_customer_idx").on(table.customerId),
    vehicleIdx: index("job_cards_vehicle_idx").on(table.vehicleId),
    statusIdx: index("job_cards_status_idx").on(table.status),
  })
);

export const jobCardItems = pgTable(
  "job_card_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobCardId: uuid("job_card_id")
      .notNull()
      .references(() => jobCards.id, { onDelete: "cascade" }),
    partId: uuid("part_id").references(() => parts.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    jobCardIdx: index("job_card_items_job_idx").on(table.jobCardId),
  })
);

export type JobCard = typeof jobCards.$inferSelect;
export type NewJobCard = typeof jobCards.$inferInsert;
export type JobCardItem = typeof jobCardItems.$inferSelect;
export type NewJobCardItem = typeof jobCardItems.$inferInsert;
