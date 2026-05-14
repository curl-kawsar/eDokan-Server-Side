import { pgTable, text, timestamp, uuid, pgEnum, index, integer } from "drizzle-orm/pg-core";
import { customers } from "./customers";

export const vehicleTypeEnum = pgEnum("vehicle_type", [
  "motorcycle",
  "car",
  "truck",
  "cng",
  "rickshaw",
  "bus",
  "microbus",
  "pickup",
  "other",
]);

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    type: vehicleTypeEnum("type").notNull().default("motorcycle"),
    brand: text("brand"),
    model: text("model"),
    registrationNo: text("registration_no").notNull(),
    chassisNo: text("chassis_no"),
    engineNo: text("engine_no"),
    color: text("color"),
    yearOfMake: integer("year_of_make"),
    mileage: integer("mileage"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    customerIdx: index("vehicles_customer_idx").on(table.customerId),
    regNoIdx: index("vehicles_reg_no_idx").on(table.registrationNo),
  })
);

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
