import { relations } from "drizzle-orm";
import { customers } from "./customers";
import { vehicles } from "./vehicles";
import { suppliers } from "./suppliers";
import { parts } from "./parts";
import { jobCards, jobCardItems } from "./job-cards";
import { invoices, payments } from "./invoices";
import { users } from "./users";

export const customersRelations = relations(customers, ({ many }) => ({
  vehicles: many(vehicles),
  jobCards: many(jobCards),
  invoices: many(invoices),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  customer: one(customers, { fields: [vehicles.customerId], references: [customers.id] }),
  jobCards: many(jobCards),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  parts: many(parts),
}));

export const partsRelations = relations(parts, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [parts.supplierId], references: [suppliers.id] }),
  jobCardItems: many(jobCardItems),
}));

export const jobCardsRelations = relations(jobCards, ({ one, many }) => ({
  customer: one(customers, { fields: [jobCards.customerId], references: [customers.id] }),
  vehicle: one(vehicles, { fields: [jobCards.vehicleId], references: [vehicles.id] }),
  assignedTo: one(users, { fields: [jobCards.assignedToId], references: [users.id] }),
  items: many(jobCardItems),
  invoices: many(invoices),
}));

export const jobCardItemsRelations = relations(jobCardItems, ({ one }) => ({
  jobCard: one(jobCards, { fields: [jobCardItems.jobCardId], references: [jobCards.id] }),
  part: one(parts, { fields: [jobCardItems.partId], references: [parts.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, { fields: [invoices.customerId], references: [customers.id] }),
  jobCard: one(jobCards, { fields: [invoices.jobCardId], references: [jobCards.id] }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
}));
