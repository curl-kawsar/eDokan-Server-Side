var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// api/vercel-entry.ts
import { handle } from "hono/vercel";

// src/app.ts
import { Hono as Hono11 } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";

// src/config/env.ts
import { z } from "zod";
import "dotenv/config";
var envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PORT: z.coerce.number().int().positive().default(8080),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:3000")
});
var parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("\u274C Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}
var env = parsed.data;

// src/middlewares/error.ts
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

// src/utils/errors.ts
var AppError = class extends Error {
  statusCode;
  code;
  details;
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR", details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
};
var BadRequestError = class extends AppError {
  constructor(message = "Bad request", details) {
    super(message, 400, "BAD_REQUEST", details);
  }
};
var UnauthorizedError = class extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
};
var NotFoundError = class extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
};
var ConflictError = class extends AppError {
  constructor(message = "Conflict") {
    super(message, 409, "CONFLICT");
  }
};

// src/middlewares/error.ts
function errorHandler(err, c) {
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err);
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...err.details ? { details: err.details } : {}
        }
      },
      err.statusCode
    );
  }
  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: err.flatten().fieldErrors
        }
      },
      422
    );
  }
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: {
          code: "HTTP_ERROR",
          message: err.message
        }
      },
      err.status
    );
  }
  const msg = err.message || "";
  if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
    return c.json(
      {
        success: false,
        error: {
          code: "CONFLICT",
          message: "A record with this value already exists"
        }
      },
      409
    );
  }
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: env.NODE_ENV === "production" ? "Something went wrong" : err.message,
        ...env.NODE_ENV !== "production" ? { stack: err.stack } : {}
      }
    },
    500
  );
}

// src/modules/auth/auth.routes.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

// src/modules/auth/auth.service.ts
import { eq } from "drizzle-orm";

// src/config/db.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// src/db/schema/index.ts
var schema_exports = {};
__export(schema_exports, {
  customers: () => customers,
  customersRelations: () => customersRelations,
  expenses: () => expenses,
  invoiceStatusEnum: () => invoiceStatusEnum,
  invoices: () => invoices,
  invoicesRelations: () => invoicesRelations,
  jobCardItems: () => jobCardItems,
  jobCardItemsRelations: () => jobCardItemsRelations,
  jobCards: () => jobCards,
  jobCardsRelations: () => jobCardsRelations,
  jobStatusEnum: () => jobStatusEnum,
  parts: () => parts,
  partsRelations: () => partsRelations,
  paymentMethodEnum: () => paymentMethodEnum,
  payments: () => payments,
  paymentsRelations: () => paymentsRelations,
  suppliers: () => suppliers,
  suppliersRelations: () => suppliersRelations,
  userRoleEnum: () => userRoleEnum,
  users: () => users,
  vehicleTypeEnum: () => vehicleTypeEnum,
  vehicles: () => vehicles,
  vehiclesRelations: () => vehiclesRelations
});

// src/db/schema/users.ts
import { pgTable, text, timestamp, uuid, pgEnum, boolean } from "drizzle-orm/pg-core";
var userRoleEnum = pgEnum("user_role", ["admin", "manager", "mechanic", "cashier"]);
var users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("admin"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

// src/db/schema/customers.ts
import { pgTable as pgTable2, text as text2, timestamp as timestamp2, uuid as uuid2, index } from "drizzle-orm/pg-core";
var customers = pgTable2(
  "customers",
  {
    id: uuid2("id").primaryKey().defaultRandom(),
    name: text2("name").notNull(),
    phone: text2("phone").notNull(),
    altPhone: text2("alt_phone"),
    email: text2("email"),
    address: text2("address"),
    nidNumber: text2("nid_number"),
    notes: text2("notes"),
    createdAt: timestamp2("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp2("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    phoneIdx: index("customers_phone_idx").on(table.phone),
    nameIdx: index("customers_name_idx").on(table.name)
  })
);

// src/db/schema/vehicles.ts
import { pgTable as pgTable3, text as text3, timestamp as timestamp3, uuid as uuid3, pgEnum as pgEnum2, index as index2, integer } from "drizzle-orm/pg-core";
var vehicleTypeEnum = pgEnum2("vehicle_type", [
  "motorcycle",
  "car",
  "truck",
  "cng",
  "rickshaw",
  "bus",
  "microbus",
  "pickup",
  "other"
]);
var vehicles = pgTable3(
  "vehicles",
  {
    id: uuid3("id").primaryKey().defaultRandom(),
    customerId: uuid3("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    type: vehicleTypeEnum("type").notNull().default("motorcycle"),
    brand: text3("brand"),
    model: text3("model"),
    registrationNo: text3("registration_no").notNull(),
    chassisNo: text3("chassis_no"),
    engineNo: text3("engine_no"),
    color: text3("color"),
    yearOfMake: integer("year_of_make"),
    mileage: integer("mileage"),
    notes: text3("notes"),
    createdAt: timestamp3("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp3("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    customerIdx: index2("vehicles_customer_idx").on(table.customerId),
    regNoIdx: index2("vehicles_reg_no_idx").on(table.registrationNo)
  })
);

// src/db/schema/suppliers.ts
import { pgTable as pgTable4, text as text4, timestamp as timestamp4, uuid as uuid4, index as index3, numeric } from "drizzle-orm/pg-core";
var suppliers = pgTable4(
  "suppliers",
  {
    id: uuid4("id").primaryKey().defaultRandom(),
    name: text4("name").notNull(),
    contactPerson: text4("contact_person"),
    phone: text4("phone").notNull(),
    altPhone: text4("alt_phone"),
    email: text4("email"),
    address: text4("address"),
    openingBalance: numeric("opening_balance", { precision: 12, scale: 2 }).notNull().default("0"),
    notes: text4("notes"),
    createdAt: timestamp4("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp4("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    nameIdx: index3("suppliers_name_idx").on(table.name),
    phoneIdx: index3("suppliers_phone_idx").on(table.phone)
  })
);

// src/db/schema/parts.ts
import { pgTable as pgTable5, text as text5, timestamp as timestamp5, uuid as uuid5, integer as integer2, numeric as numeric2, index as index4 } from "drizzle-orm/pg-core";
var parts = pgTable5(
  "parts",
  {
    id: uuid5("id").primaryKey().defaultRandom(),
    sku: text5("sku").notNull().unique(),
    name: text5("name").notNull(),
    nameBn: text5("name_bn"),
    category: text5("category"),
    brand: text5("brand"),
    unit: text5("unit").notNull().default("pcs"),
    purchasePrice: numeric2("purchase_price", { precision: 12, scale: 2 }).notNull().default("0"),
    sellingPrice: numeric2("selling_price", { precision: 12, scale: 2 }).notNull().default("0"),
    stockQty: integer2("stock_qty").notNull().default(0),
    lowStockThreshold: integer2("low_stock_threshold").notNull().default(5),
    supplierId: uuid5("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    description: text5("description"),
    createdAt: timestamp5("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp5("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    skuIdx: index4("parts_sku_idx").on(table.sku),
    nameIdx: index4("parts_name_idx").on(table.name),
    categoryIdx: index4("parts_category_idx").on(table.category)
  })
);

// src/db/schema/job-cards.ts
import {
  pgTable as pgTable6,
  text as text6,
  timestamp as timestamp6,
  uuid as uuid6,
  pgEnum as pgEnum3,
  integer as integer3,
  numeric as numeric3,
  index as index5,
  date
} from "drizzle-orm/pg-core";
var jobStatusEnum = pgEnum3("job_status", [
  "pending",
  "in_progress",
  "completed",
  "delivered",
  "cancelled"
]);
var jobCards = pgTable6(
  "job_cards",
  {
    id: uuid6("id").primaryKey().defaultRandom(),
    jobNo: text6("job_no").notNull().unique(),
    customerId: uuid6("customer_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
    vehicleId: uuid6("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "restrict" }),
    assignedToId: uuid6("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
    status: jobStatusEnum("status").notNull().default("pending"),
    complaint: text6("complaint"),
    diagnosis: text6("diagnosis"),
    workDone: text6("work_done"),
    mileageIn: integer3("mileage_in"),
    laborCost: numeric3("labor_cost", { precision: 12, scale: 2 }).notNull().default("0"),
    discount: numeric3("discount", { precision: 12, scale: 2 }).notNull().default("0"),
    receivedDate: date("received_date").notNull().defaultNow(),
    expectedDeliveryDate: date("expected_delivery_date"),
    deliveredDate: date("delivered_date"),
    notes: text6("notes"),
    createdAt: timestamp6("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp6("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    jobNoIdx: index5("job_cards_job_no_idx").on(table.jobNo),
    customerIdx: index5("job_cards_customer_idx").on(table.customerId),
    vehicleIdx: index5("job_cards_vehicle_idx").on(table.vehicleId),
    statusIdx: index5("job_cards_status_idx").on(table.status)
  })
);
var jobCardItems = pgTable6(
  "job_card_items",
  {
    id: uuid6("id").primaryKey().defaultRandom(),
    jobCardId: uuid6("job_card_id").notNull().references(() => jobCards.id, { onDelete: "cascade" }),
    partId: uuid6("part_id").references(() => parts.id, { onDelete: "set null" }),
    name: text6("name").notNull(),
    quantity: integer3("quantity").notNull().default(1),
    unitPrice: numeric3("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
    total: numeric3("total", { precision: 12, scale: 2 }).notNull().default("0"),
    createdAt: timestamp6("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    jobCardIdx: index5("job_card_items_job_idx").on(table.jobCardId)
  })
);

// src/db/schema/invoices.ts
import {
  pgTable as pgTable7,
  text as text7,
  timestamp as timestamp7,
  uuid as uuid7,
  pgEnum as pgEnum4,
  numeric as numeric4,
  index as index6,
  date as date2
} from "drizzle-orm/pg-core";
var invoiceStatusEnum = pgEnum4("invoice_status", [
  "draft",
  "unpaid",
  "partial",
  "paid",
  "cancelled"
]);
var paymentMethodEnum = pgEnum4("payment_method", [
  "cash",
  "bkash",
  "nagad",
  "rocket",
  "bank",
  "card",
  "other"
]);
var invoices = pgTable7(
  "invoices",
  {
    id: uuid7("id").primaryKey().defaultRandom(),
    invoiceNo: text7("invoice_no").notNull().unique(),
    jobCardId: uuid7("job_card_id").references(() => jobCards.id, { onDelete: "set null" }),
    customerId: uuid7("customer_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
    issueDate: date2("issue_date").notNull().defaultNow(),
    dueDate: date2("due_date"),
    subtotal: numeric4("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
    discount: numeric4("discount", { precision: 12, scale: 2 }).notNull().default("0"),
    tax: numeric4("tax", { precision: 12, scale: 2 }).notNull().default("0"),
    total: numeric4("total", { precision: 12, scale: 2 }).notNull().default("0"),
    paidAmount: numeric4("paid_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    dueAmount: numeric4("due_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    status: invoiceStatusEnum("status").notNull().default("unpaid"),
    notes: text7("notes"),
    createdAt: timestamp7("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp7("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    invoiceNoIdx: index6("invoices_invoice_no_idx").on(table.invoiceNo),
    customerIdx: index6("invoices_customer_idx").on(table.customerId),
    statusIdx: index6("invoices_status_idx").on(table.status)
  })
);
var payments = pgTable7(
  "payments",
  {
    id: uuid7("id").primaryKey().defaultRandom(),
    invoiceId: uuid7("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
    amount: numeric4("amount", { precision: 12, scale: 2 }).notNull(),
    method: paymentMethodEnum("method").notNull().default("cash"),
    transactionRef: text7("transaction_ref"),
    paidAt: timestamp7("paid_at", { withTimezone: true }).notNull().defaultNow(),
    notes: text7("notes"),
    createdAt: timestamp7("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    invoiceIdx: index6("payments_invoice_idx").on(table.invoiceId)
  })
);

// src/db/schema/expenses.ts
import { pgTable as pgTable8, text as text8, timestamp as timestamp8, uuid as uuid8, numeric as numeric5, date as date3, index as index7 } from "drizzle-orm/pg-core";
var expenses = pgTable8(
  "expenses",
  {
    id: uuid8("id").primaryKey().defaultRandom(),
    title: text8("title").notNull(),
    category: text8("category").notNull().default("misc"),
    amount: numeric5("amount", { precision: 12, scale: 2 }).notNull(),
    expenseDate: date3("expense_date").notNull().defaultNow(),
    paymentMethod: text8("payment_method").default("cash"),
    notes: text8("notes"),
    createdAt: timestamp8("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp8("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    dateIdx: index7("expenses_date_idx").on(table.expenseDate),
    categoryIdx: index7("expenses_category_idx").on(table.category)
  })
);

// src/db/schema/relations.ts
import { relations } from "drizzle-orm";
var customersRelations = relations(customers, ({ many }) => ({
  vehicles: many(vehicles),
  jobCards: many(jobCards),
  invoices: many(invoices)
}));
var vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  customer: one(customers, { fields: [vehicles.customerId], references: [customers.id] }),
  jobCards: many(jobCards)
}));
var suppliersRelations = relations(suppliers, ({ many }) => ({
  parts: many(parts)
}));
var partsRelations = relations(parts, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [parts.supplierId], references: [suppliers.id] }),
  jobCardItems: many(jobCardItems)
}));
var jobCardsRelations = relations(jobCards, ({ one, many }) => ({
  customer: one(customers, { fields: [jobCards.customerId], references: [customers.id] }),
  vehicle: one(vehicles, { fields: [jobCards.vehicleId], references: [vehicles.id] }),
  assignedTo: one(users, { fields: [jobCards.assignedToId], references: [users.id] }),
  items: many(jobCardItems),
  invoices: many(invoices)
}));
var jobCardItemsRelations = relations(jobCardItems, ({ one }) => ({
  jobCard: one(jobCards, { fields: [jobCardItems.jobCardId], references: [jobCards.id] }),
  part: one(parts, { fields: [jobCardItems.partId], references: [parts.id] })
}));
var invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, { fields: [invoices.customerId], references: [customers.id] }),
  jobCard: one(jobCards, { fields: [invoices.jobCardId], references: [jobCards.id] }),
  payments: many(payments)
}));
var paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] })
}));

// src/config/db.ts
var sql = neon(env.DATABASE_URL);
var db = drizzle(sql, { schema: schema_exports, casing: "snake_case" });

// src/utils/password.ts
import bcrypt from "bcryptjs";
var SALT_ROUNDS = 10;
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// src/utils/jwt.ts
import { SignJWT, jwtVerify } from "jose";
var secret = new TextEncoder().encode(env.JWT_SECRET);
async function signToken(payload) {
  return await new SignJWT({ ...payload }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(env.JWT_EXPIRES_IN).sign(secret);
}
async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

// src/modules/auth/auth.service.ts
var authService = {
  async register(input) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, input.email)
    });
    if (existing) throw new ConflictError("\u098F\u0987 \u0987\u09AE\u09C7\u0987\u09B2\u099F\u09BF \u0987\u09A4\u09BF\u09AE\u09A7\u09CD\u09AF\u09C7 \u09AC\u09CD\u09AF\u09AC\u09B9\u09C3\u09A4 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
    const passwordHash = await hashPassword(input.password);
    const [user] = await db.insert(users).values({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: input.role
    }).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt
    });
    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });
    return { user, token };
  },
  async login(input) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, input.email)
    });
    if (!user) throw new UnauthorizedError("\u09AD\u09C1\u09B2 \u0987\u09AE\u09C7\u0987\u09B2 \u09AC\u09BE \u09AA\u09BE\u09B8\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1");
    if (!user.isActive) throw new UnauthorizedError("\u0986\u09AA\u09A8\u09BE\u09B0 \u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F \u09A8\u09BF\u09B7\u09CD\u0995\u09CD\u09B0\u09BF\u09AF\u09BC \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError("\u09AD\u09C1\u09B2 \u0987\u09AE\u09C7\u0987\u09B2 \u09AC\u09BE \u09AA\u09BE\u09B8\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1");
    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });
    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, token };
  },
  async getCurrentUser(userId) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
    if (!user) throw new NotFoundError("User");
    return user;
  },
  async updateProfile(userId, input) {
    const data = { updatedAt: /* @__PURE__ */ new Date() };
    if (input.name !== void 0) data.name = input.name;
    if (input.phone !== void 0) data.phone = input.phone || null;
    const [user] = await db.update(users).set(data).where(eq(users.id, userId)).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt
    });
    if (!user) throw new NotFoundError("User");
    return user;
  },
  async changePassword(userId, input) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) throw new NotFoundError("User");
    const ok = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestError("\u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8 \u09AA\u09BE\u09B8\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1 \u09B8\u09A0\u09BF\u0995 \u09A8\u09AF\u09BC");
    const passwordHash = await hashPassword(input.newPassword);
    await db.update(users).set({ passwordHash, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
    return { success: true };
  }
};

// src/utils/response.ts
function success(c, data, message, status = 200) {
  return c.json(
    {
      success: true,
      data,
      ...message ? { message } : {}
    },
    status
  );
}
function created(c, data, message = "Created successfully") {
  return success(c, data, message, 201);
}
function paginated(c, data, meta) {
  const totalPages = Math.ceil(meta.total / meta.limit) || 1;
  return c.json(
    {
      success: true,
      data,
      meta: { ...meta, totalPages }
    },
    200
  );
}

// src/modules/auth/auth.controller.ts
var authController = {
  async register(c) {
    const body = await c.req.json();
    const result = await authService.register(body);
    return created(c, result, "\u09A8\u09BF\u09AC\u09A8\u09CD\u09A7\u09A8 \u09B8\u09AB\u09B2 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async login(c) {
    const body = await c.req.json();
    const result = await authService.login(body);
    return success(c, result, "\u09B2\u0997\u0987\u09A8 \u09B8\u09AB\u09B2 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async me(c) {
    const user = c.get("user");
    const result = await authService.getCurrentUser(user.sub);
    return success(c, result);
  },
  async updateProfile(c) {
    const user = c.get("user");
    const body = await c.req.json();
    const result = await authService.updateProfile(user.sub, body);
    return success(c, result, "\u09AA\u09CD\u09B0\u09CB\u09AB\u09BE\u0987\u09B2 \u0986\u09AA\u09A1\u09C7\u099F \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async changePassword(c) {
    const user = c.get("user");
    const body = await c.req.json();
    const result = await authService.changePassword(user.sub, body);
    return success(c, result, "\u09AA\u09BE\u09B8\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1 \u09AA\u09B0\u09BF\u09AC\u09B0\u09CD\u09A4\u09A8 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  }
};

// src/modules/auth/auth.schema.ts
import { z as z2 } from "zod";
var loginSchema = z2.object({
  email: z2.string().email("\u09B8\u09A0\u09BF\u0995 \u0987\u09AE\u09C7\u0987\u09B2 \u09A6\u09BF\u09A8"),
  password: z2.string().min(6, "\u09AA\u09BE\u09B8\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1 \u0995\u09AE\u09AA\u0995\u09CD\u09B7\u09C7 \u09EC \u0985\u0995\u09CD\u09B7\u09B0\u09C7\u09B0 \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7")
});
var registerSchema = z2.object({
  name: z2.string().min(2, "\u09A8\u09BE\u09AE \u0995\u09AE\u09AA\u0995\u09CD\u09B7\u09C7 \u09E8 \u0985\u0995\u09CD\u09B7\u09B0\u09C7\u09B0 \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7"),
  email: z2.string().email("\u09B8\u09A0\u09BF\u0995 \u0987\u09AE\u09C7\u0987\u09B2 \u09A6\u09BF\u09A8"),
  phone: z2.string().optional(),
  password: z2.string().min(6, "\u09AA\u09BE\u09B8\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1 \u0995\u09AE\u09AA\u0995\u09CD\u09B7\u09C7 \u09EC \u0985\u0995\u09CD\u09B7\u09B0\u09C7\u09B0 \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7"),
  role: z2.enum(["admin", "manager", "mechanic", "cashier"]).default("admin")
});
var updateProfileSchema = z2.object({
  name: z2.string().min(2, "\u09A8\u09BE\u09AE \u0995\u09AE\u09AA\u0995\u09CD\u09B7\u09C7 \u09E8 \u0985\u0995\u09CD\u09B7\u09B0\u09C7\u09B0 \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7").optional(),
  phone: z2.string().max(20).optional().nullable()
});
var changePasswordSchema = z2.object({
  currentPassword: z2.string().min(1, "\u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8 \u09AA\u09BE\u09B8\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1 \u09A6\u09BF\u09A8"),
  newPassword: z2.string().min(6, "\u09A8\u09A4\u09C1\u09A8 \u09AA\u09BE\u09B8\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1 \u0995\u09AE\u09AA\u0995\u09CD\u09B7\u09C7 \u09EC \u0985\u0995\u09CD\u09B7\u09B0\u09C7\u09B0 \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7")
});

// src/middlewares/auth.ts
async function authMiddleware(c, next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid authorization header");
  }
  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  c.set("user", payload);
  await next();
}

// src/modules/auth/auth.routes.ts
var authRoutes = new Hono();
authRoutes.post("/register", zValidator("json", registerSchema), authController.register);
authRoutes.post("/login", zValidator("json", loginSchema), authController.login);
authRoutes.get("/me", authMiddleware, authController.me);
authRoutes.patch(
  "/me",
  authMiddleware,
  zValidator("json", updateProfileSchema),
  authController.updateProfile
);
authRoutes.post(
  "/change-password",
  authMiddleware,
  zValidator("json", changePasswordSchema),
  authController.changePassword
);
var auth_routes_default = authRoutes;

// src/modules/customers/customer.routes.ts
import { Hono as Hono2 } from "hono";
import { zValidator as zValidator2 } from "@hono/zod-validator";

// src/modules/customers/customer.service.ts
import { asc, desc, eq as eq2, ilike, or, sql as sql2 } from "drizzle-orm";

// src/utils/pagination.ts
import { z as z3 } from "zod";
var paginationSchema = z3.object({
  page: z3.coerce.number().int().positive().default(1),
  limit: z3.coerce.number().int().positive().max(100).default(20),
  search: z3.string().trim().optional(),
  sortBy: z3.string().optional(),
  sortOrder: z3.enum(["asc", "desc"]).default("desc")
});
function getOffset(page, limit) {
  return (page - 1) * limit;
}

// src/modules/customers/customer.service.ts
function cleanInput(input) {
  const out = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === "") out[k] = null;
    else out[k] = v;
  }
  return out;
}
var customerService = {
  async list(params) {
    const { page, limit, search, sortBy, sortOrder } = params;
    const where = search ? or(
      ilike(customers.name, `%${search}%`),
      ilike(customers.phone, `%${search}%`),
      ilike(customers.email, `%${search}%`)
    ) : void 0;
    const orderColumn = sortBy === "name" ? customers.name : sortBy === "phone" ? customers.phone : customers.createdAt;
    const orderFn = sortOrder === "asc" ? asc : desc;
    const [rows, totalRow] = await Promise.all([
      db.select().from(customers).where(where).orderBy(orderFn(orderColumn)).limit(limit).offset(getOffset(page, limit)),
      db.select({ count: sql2`count(*)::int` }).from(customers).where(where)
    ]);
    return { rows, total: totalRow[0]?.count ?? 0 };
  },
  async getById(id) {
    const customer = await db.query.customers.findFirst({
      where: eq2(customers.id, id),
      with: { vehicles: true }
    });
    if (!customer) throw new NotFoundError("\u0997\u09CD\u09B0\u09BE\u09B9\u0995");
    return customer;
  },
  async create(input) {
    const data = cleanInput(input);
    const [row] = await db.insert(customers).values(data).returning();
    return row;
  },
  async update(id, input) {
    const data = cleanInput(input);
    const [row] = await db.update(customers).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(customers.id, id)).returning();
    if (!row) throw new NotFoundError("\u0997\u09CD\u09B0\u09BE\u09B9\u0995");
    return row;
  },
  async delete(id) {
    const [row] = await db.delete(customers).where(eq2(customers.id, id)).returning();
    if (!row) throw new NotFoundError("\u0997\u09CD\u09B0\u09BE\u09B9\u0995");
    return row;
  }
};

// src/modules/customers/customer.controller.ts
var customerController = {
  async list(c) {
    const params = paginationSchema.parse(c.req.query());
    const { rows, total } = await customerService.list(params);
    return paginated(c, rows, { page: params.page, limit: params.limit, total });
  },
  async get(c) {
    const id = c.req.param("id");
    const data = await customerService.getById(id);
    return success(c, data);
  },
  async create(c) {
    const body = await c.req.json();
    const data = await customerService.create(body);
    return created(c, data, "\u0997\u09CD\u09B0\u09BE\u09B9\u0995 \u09B8\u09AB\u09B2\u09AD\u09BE\u09AC\u09C7 \u09AF\u09C1\u0995\u09CD\u09A4 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async update(c) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = await customerService.update(id, body);
    return success(c, data, "\u0997\u09CD\u09B0\u09BE\u09B9\u0995\u09C7\u09B0 \u09A4\u09A5\u09CD\u09AF \u0986\u09AA\u09A1\u09C7\u099F \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async remove(c) {
    const id = c.req.param("id");
    await customerService.delete(id);
    return success(c, { id }, "\u0997\u09CD\u09B0\u09BE\u09B9\u0995 \u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  }
};

// src/modules/customers/customer.schema.ts
import { z as z4 } from "zod";
var createCustomerSchema = z4.object({
  name: z4.string().min(1, "\u09A8\u09BE\u09AE \u0986\u09AC\u09B6\u09CD\u09AF\u0995").max(200),
  phone: z4.string().min(6, "\u09B8\u09A0\u09BF\u0995 \u09AB\u09CB\u09A8 \u09A8\u09AE\u09CD\u09AC\u09B0 \u09A6\u09BF\u09A8").max(20),
  altPhone: z4.string().max(20).optional().nullable(),
  email: z4.string().email("\u09B8\u09A0\u09BF\u0995 \u0987\u09AE\u09C7\u0987\u09B2 \u09A6\u09BF\u09A8").optional().nullable().or(z4.literal("")),
  address: z4.string().max(500).optional().nullable(),
  nidNumber: z4.string().max(30).optional().nullable(),
  notes: z4.string().max(1e3).optional().nullable()
});
var updateCustomerSchema = createCustomerSchema.partial();

// src/modules/customers/customer.routes.ts
var customerRoutes = new Hono2();
customerRoutes.use("*", authMiddleware);
customerRoutes.get("/", customerController.list);
customerRoutes.get("/:id", customerController.get);
customerRoutes.post("/", zValidator2("json", createCustomerSchema), customerController.create);
customerRoutes.patch("/:id", zValidator2("json", updateCustomerSchema), customerController.update);
customerRoutes.delete("/:id", customerController.remove);
var customer_routes_default = customerRoutes;

// src/modules/vehicles/vehicle.routes.ts
import { Hono as Hono3 } from "hono";
import { zValidator as zValidator3 } from "@hono/zod-validator";

// src/modules/vehicles/vehicle.controller.ts
import { z as z5 } from "zod";

// src/modules/vehicles/vehicle.service.ts
import { and as and2, asc as asc2, desc as desc2, eq as eq3, ilike as ilike2, or as or2, sql as sql3 } from "drizzle-orm";
function cleanInput2(input) {
  const out = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === "") out[k] = null;
    else out[k] = v;
  }
  return out;
}
var vehicleService = {
  async list(params) {
    const { page, limit, search, sortOrder, customerId } = params;
    const conditions = [];
    if (search) {
      conditions.push(
        or2(
          ilike2(vehicles.registrationNo, `%${search}%`),
          ilike2(vehicles.brand, `%${search}%`),
          ilike2(vehicles.model, `%${search}%`),
          ilike2(vehicles.chassisNo, `%${search}%`)
        )
      );
    }
    if (customerId) conditions.push(eq3(vehicles.customerId, customerId));
    const where = conditions.length ? and2(...conditions) : void 0;
    const orderFn = sortOrder === "asc" ? asc2 : desc2;
    const [rows, totalRow] = await Promise.all([
      db.query.vehicles.findMany({
        where,
        with: { customer: true },
        orderBy: [orderFn(vehicles.createdAt)],
        limit,
        offset: getOffset(page, limit)
      }),
      db.select({ count: sql3`count(*)::int` }).from(vehicles).where(where)
    ]);
    return { rows, total: totalRow[0]?.count ?? 0 };
  },
  async getById(id) {
    const vehicle = await db.query.vehicles.findFirst({
      where: eq3(vehicles.id, id),
      with: { customer: true }
    });
    if (!vehicle) throw new NotFoundError("\u09AF\u09BE\u09A8\u09AC\u09BE\u09B9\u09A8");
    return vehicle;
  },
  async create(input) {
    const data = cleanInput2(input);
    const [row] = await db.insert(vehicles).values(data).returning();
    return row;
  },
  async update(id, input) {
    const data = cleanInput2(input);
    const [row] = await db.update(vehicles).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(vehicles.id, id)).returning();
    if (!row) throw new NotFoundError("\u09AF\u09BE\u09A8\u09AC\u09BE\u09B9\u09A8");
    return row;
  },
  async delete(id) {
    const [row] = await db.delete(vehicles).where(eq3(vehicles.id, id)).returning();
    if (!row) throw new NotFoundError("\u09AF\u09BE\u09A8\u09AC\u09BE\u09B9\u09A8");
    return row;
  }
};

// src/modules/vehicles/vehicle.controller.ts
var listQuerySchema = paginationSchema.extend({
  customerId: z5.string().uuid().optional()
});
var vehicleController = {
  async list(c) {
    const params = listQuerySchema.parse(c.req.query());
    const { rows, total } = await vehicleService.list(params);
    return paginated(c, rows, { page: params.page, limit: params.limit, total });
  },
  async get(c) {
    const data = await vehicleService.getById(c.req.param("id"));
    return success(c, data);
  },
  async create(c) {
    const body = await c.req.json();
    const data = await vehicleService.create(body);
    return created(c, data, "\u09AF\u09BE\u09A8\u09AC\u09BE\u09B9\u09A8 \u09B8\u09AB\u09B2\u09AD\u09BE\u09AC\u09C7 \u09AF\u09C1\u0995\u09CD\u09A4 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async update(c) {
    const body = await c.req.json();
    const data = await vehicleService.update(c.req.param("id"), body);
    return success(c, data, "\u09AF\u09BE\u09A8\u09AC\u09BE\u09B9\u09A8\u09C7\u09B0 \u09A4\u09A5\u09CD\u09AF \u0986\u09AA\u09A1\u09C7\u099F \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async remove(c) {
    const id = c.req.param("id");
    await vehicleService.delete(id);
    return success(c, { id }, "\u09AF\u09BE\u09A8\u09AC\u09BE\u09B9\u09A8 \u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  }
};

// src/modules/vehicles/vehicle.schema.ts
import { z as z6 } from "zod";
var vehicleTypeValues = [
  "motorcycle",
  "car",
  "truck",
  "cng",
  "rickshaw",
  "bus",
  "microbus",
  "pickup",
  "other"
];
var createVehicleSchema = z6.object({
  customerId: z6.string().uuid("\u09B8\u09A0\u09BF\u0995 \u0997\u09CD\u09B0\u09BE\u09B9\u0995 \u0986\u0987\u09A1\u09BF \u09A6\u09BF\u09A8"),
  type: z6.enum(vehicleTypeValues).default("motorcycle"),
  brand: z6.string().max(100).optional().nullable(),
  model: z6.string().max(100).optional().nullable(),
  registrationNo: z6.string().min(1, "\u09B0\u09C7\u099C\u09BF\u09B8\u09CD\u099F\u09CD\u09B0\u09C7\u09B6\u09A8 \u09A8\u09AE\u09CD\u09AC\u09B0 \u0986\u09AC\u09B6\u09CD\u09AF\u0995").max(50),
  chassisNo: z6.string().max(100).optional().nullable(),
  engineNo: z6.string().max(100).optional().nullable(),
  color: z6.string().max(50).optional().nullable(),
  yearOfMake: z6.coerce.number().int().min(1950).max(2100).optional().nullable(),
  mileage: z6.coerce.number().int().min(0).optional().nullable(),
  notes: z6.string().max(1e3).optional().nullable()
});
var updateVehicleSchema = createVehicleSchema.partial();

// src/modules/vehicles/vehicle.routes.ts
var vehicleRoutes = new Hono3();
vehicleRoutes.use("*", authMiddleware);
vehicleRoutes.get("/", vehicleController.list);
vehicleRoutes.get("/:id", vehicleController.get);
vehicleRoutes.post("/", zValidator3("json", createVehicleSchema), vehicleController.create);
vehicleRoutes.patch("/:id", zValidator3("json", updateVehicleSchema), vehicleController.update);
vehicleRoutes.delete("/:id", vehicleController.remove);
var vehicle_routes_default = vehicleRoutes;

// src/modules/parts/part.routes.ts
import { Hono as Hono4 } from "hono";
import { zValidator as zValidator4 } from "@hono/zod-validator";

// src/modules/parts/part.controller.ts
import { z as z7 } from "zod";

// src/modules/parts/part.service.ts
import { and as and3, asc as asc3, desc as desc3, eq as eq4, ilike as ilike3, or as or3, sql as sql4 } from "drizzle-orm";
function cleanInput3(input) {
  const out = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === "") out[k] = null;
    else if (typeof v === "number") out[k] = v.toString();
    else out[k] = v;
  }
  return out;
}
var partService = {
  async list(params) {
    const { page, limit, search, sortOrder, lowStock } = params;
    const conditions = [];
    if (search) {
      conditions.push(
        or3(
          ilike3(parts.name, `%${search}%`),
          ilike3(parts.sku, `%${search}%`),
          ilike3(parts.brand, `%${search}%`),
          ilike3(parts.category, `%${search}%`)
        )
      );
    }
    if (lowStock) {
      conditions.push(sql4`${parts.stockQty} <= ${parts.lowStockThreshold}`);
    }
    const where = conditions.length ? and3(...conditions) : void 0;
    const orderFn = sortOrder === "asc" ? asc3 : desc3;
    const [rows, totalRow] = await Promise.all([
      db.query.parts.findMany({
        where,
        with: { supplier: true },
        orderBy: [orderFn(parts.createdAt)],
        limit,
        offset: getOffset(page, limit)
      }),
      db.select({ count: sql4`count(*)::int` }).from(parts).where(where)
    ]);
    return { rows, total: totalRow[0]?.count ?? 0 };
  },
  async getById(id) {
    const part = await db.query.parts.findFirst({
      where: eq4(parts.id, id),
      with: { supplier: true }
    });
    if (!part) throw new NotFoundError("\u09AA\u09BE\u09B0\u09CD\u099F\u09B8");
    return part;
  },
  async create(input) {
    const data = cleanInput3(input);
    const [row] = await db.insert(parts).values(data).returning();
    return row;
  },
  async update(id, input) {
    const data = cleanInput3(input);
    const [row] = await db.update(parts).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(parts.id, id)).returning();
    if (!row) throw new NotFoundError("\u09AA\u09BE\u09B0\u09CD\u099F\u09B8");
    return row;
  },
  async delete(id) {
    const [row] = await db.delete(parts).where(eq4(parts.id, id)).returning();
    if (!row) throw new NotFoundError("\u09AA\u09BE\u09B0\u09CD\u099F\u09B8");
    return row;
  },
  async adjustStock(id, input) {
    const part = await db.query.parts.findFirst({ where: eq4(parts.id, id) });
    if (!part) throw new NotFoundError("\u09AA\u09BE\u09B0\u09CD\u099F\u09B8");
    const newQty = part.stockQty + input.quantity;
    if (newQty < 0) throw new BadRequestError("\u09AA\u09B0\u09CD\u09AF\u09BE\u09AA\u09CD\u09A4 \u09B8\u09CD\u099F\u0995 \u09A8\u09C7\u0987");
    const [row] = await db.update(parts).set({ stockQty: newQty, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(parts.id, id)).returning();
    return row;
  }
};

// src/modules/parts/part.controller.ts
var listQuerySchema2 = paginationSchema.extend({
  lowStock: z7.coerce.boolean().optional()
});
var partController = {
  async list(c) {
    const params = listQuerySchema2.parse(c.req.query());
    const { rows, total } = await partService.list(params);
    return paginated(c, rows, { page: params.page, limit: params.limit, total });
  },
  async get(c) {
    const data = await partService.getById(c.req.param("id"));
    return success(c, data);
  },
  async create(c) {
    const body = await c.req.json();
    const data = await partService.create(body);
    return created(c, data, "\u09AA\u09BE\u09B0\u09CD\u099F\u09B8 \u09B8\u09AB\u09B2\u09AD\u09BE\u09AC\u09C7 \u09AF\u09C1\u0995\u09CD\u09A4 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async update(c) {
    const body = await c.req.json();
    const data = await partService.update(c.req.param("id"), body);
    return success(c, data, "\u09AA\u09BE\u09B0\u09CD\u099F\u09B8\u09C7\u09B0 \u09A4\u09A5\u09CD\u09AF \u0986\u09AA\u09A1\u09C7\u099F \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async remove(c) {
    const id = c.req.param("id");
    await partService.delete(id);
    return success(c, { id }, "\u09AA\u09BE\u09B0\u09CD\u099F\u09B8 \u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async adjustStock(c) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = await partService.adjustStock(id, body);
    return success(c, data, "\u09B8\u09CD\u099F\u0995 \u09B9\u09BE\u09B2\u09A8\u09BE\u0997\u09BE\u09A6 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  }
};

// src/modules/parts/part.schema.ts
import { z as z8 } from "zod";
var createPartSchema = z8.object({
  sku: z8.string().min(1, "SKU \u0986\u09AC\u09B6\u09CD\u09AF\u0995").max(50),
  name: z8.string().min(1, "\u09A8\u09BE\u09AE \u0986\u09AC\u09B6\u09CD\u09AF\u0995").max(200),
  nameBn: z8.string().max(200).optional().nullable(),
  category: z8.string().max(100).optional().nullable(),
  brand: z8.string().max(100).optional().nullable(),
  unit: z8.string().max(20).default("pcs"),
  purchasePrice: z8.coerce.number().min(0).default(0),
  sellingPrice: z8.coerce.number().min(0).default(0),
  stockQty: z8.coerce.number().int().min(0).default(0),
  lowStockThreshold: z8.coerce.number().int().min(0).default(5),
  supplierId: z8.string().uuid().optional().nullable(),
  description: z8.string().max(1e3).optional().nullable()
});
var updatePartSchema = createPartSchema.partial();
var stockAdjustmentSchema = z8.object({
  quantity: z8.coerce.number().int(),
  reason: z8.string().optional()
});

// src/modules/parts/part.routes.ts
var partRoutes = new Hono4();
partRoutes.use("*", authMiddleware);
partRoutes.get("/", partController.list);
partRoutes.get("/:id", partController.get);
partRoutes.post("/", zValidator4("json", createPartSchema), partController.create);
partRoutes.patch("/:id", zValidator4("json", updatePartSchema), partController.update);
partRoutes.delete("/:id", partController.remove);
partRoutes.post(
  "/:id/stock-adjustment",
  zValidator4("json", stockAdjustmentSchema),
  partController.adjustStock
);
var part_routes_default = partRoutes;

// src/modules/suppliers/supplier.routes.ts
import { Hono as Hono5 } from "hono";
import { zValidator as zValidator5 } from "@hono/zod-validator";

// src/modules/suppliers/supplier.service.ts
import { asc as asc4, desc as desc4, eq as eq5, ilike as ilike4, or as or4, sql as sql5 } from "drizzle-orm";
function cleanInput4(input) {
  const out = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === "") out[k] = null;
    else if (typeof v === "number") out[k] = v.toString();
    else out[k] = v;
  }
  return out;
}
var supplierService = {
  async list(params) {
    const { page, limit, search, sortOrder } = params;
    const where = search ? or4(
      ilike4(suppliers.name, `%${search}%`),
      ilike4(suppliers.phone, `%${search}%`),
      ilike4(suppliers.contactPerson, `%${search}%`)
    ) : void 0;
    const orderFn = sortOrder === "asc" ? asc4 : desc4;
    const [rows, totalRow] = await Promise.all([
      db.select().from(suppliers).where(where).orderBy(orderFn(suppliers.createdAt)).limit(limit).offset(getOffset(page, limit)),
      db.select({ count: sql5`count(*)::int` }).from(suppliers).where(where)
    ]);
    return { rows, total: totalRow[0]?.count ?? 0 };
  },
  async getById(id) {
    const supplier = await db.query.suppliers.findFirst({
      where: eq5(suppliers.id, id),
      with: { parts: true }
    });
    if (!supplier) throw new NotFoundError("\u09B8\u09B0\u09AC\u09B0\u09BE\u09B9\u0995\u09BE\u09B0\u09C0");
    return supplier;
  },
  async create(input) {
    const data = cleanInput4(input);
    const [row] = await db.insert(suppliers).values(data).returning();
    return row;
  },
  async update(id, input) {
    const data = cleanInput4(input);
    const [row] = await db.update(suppliers).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq5(suppliers.id, id)).returning();
    if (!row) throw new NotFoundError("\u09B8\u09B0\u09AC\u09B0\u09BE\u09B9\u0995\u09BE\u09B0\u09C0");
    return row;
  },
  async delete(id) {
    const [row] = await db.delete(suppliers).where(eq5(suppliers.id, id)).returning();
    if (!row) throw new NotFoundError("\u09B8\u09B0\u09AC\u09B0\u09BE\u09B9\u0995\u09BE\u09B0\u09C0");
    return row;
  }
};

// src/modules/suppliers/supplier.controller.ts
var supplierController = {
  async list(c) {
    const params = paginationSchema.parse(c.req.query());
    const { rows, total } = await supplierService.list(params);
    return paginated(c, rows, { page: params.page, limit: params.limit, total });
  },
  async get(c) {
    const data = await supplierService.getById(c.req.param("id"));
    return success(c, data);
  },
  async create(c) {
    const body = await c.req.json();
    const data = await supplierService.create(body);
    return created(c, data, "\u09B8\u09B0\u09AC\u09B0\u09BE\u09B9\u0995\u09BE\u09B0\u09C0 \u09AF\u09C1\u0995\u09CD\u09A4 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async update(c) {
    const body = await c.req.json();
    const data = await supplierService.update(c.req.param("id"), body);
    return success(c, data, "\u09B8\u09B0\u09AC\u09B0\u09BE\u09B9\u0995\u09BE\u09B0\u09C0\u09B0 \u09A4\u09A5\u09CD\u09AF \u0986\u09AA\u09A1\u09C7\u099F \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async remove(c) {
    const id = c.req.param("id");
    await supplierService.delete(id);
    return success(c, { id }, "\u09B8\u09B0\u09AC\u09B0\u09BE\u09B9\u0995\u09BE\u09B0\u09C0 \u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  }
};

// src/modules/suppliers/supplier.schema.ts
import { z as z9 } from "zod";
var createSupplierSchema = z9.object({
  name: z9.string().min(1, "\u09A8\u09BE\u09AE \u0986\u09AC\u09B6\u09CD\u09AF\u0995").max(200),
  contactPerson: z9.string().max(200).optional().nullable(),
  phone: z9.string().min(6, "\u09B8\u09A0\u09BF\u0995 \u09AB\u09CB\u09A8 \u09A8\u09AE\u09CD\u09AC\u09B0 \u09A6\u09BF\u09A8").max(20),
  altPhone: z9.string().max(20).optional().nullable(),
  email: z9.string().email("\u09B8\u09A0\u09BF\u0995 \u0987\u09AE\u09C7\u0987\u09B2 \u09A6\u09BF\u09A8").optional().nullable().or(z9.literal("")),
  address: z9.string().max(500).optional().nullable(),
  openingBalance: z9.coerce.number().default(0),
  notes: z9.string().max(1e3).optional().nullable()
});
var updateSupplierSchema = createSupplierSchema.partial();

// src/modules/suppliers/supplier.routes.ts
var supplierRoutes = new Hono5();
supplierRoutes.use("*", authMiddleware);
supplierRoutes.get("/", supplierController.list);
supplierRoutes.get("/:id", supplierController.get);
supplierRoutes.post("/", zValidator5("json", createSupplierSchema), supplierController.create);
supplierRoutes.patch("/:id", zValidator5("json", updateSupplierSchema), supplierController.update);
supplierRoutes.delete("/:id", supplierController.remove);
var supplier_routes_default = supplierRoutes;

// src/modules/job-cards/job-card.routes.ts
import { Hono as Hono6 } from "hono";
import { zValidator as zValidator6 } from "@hono/zod-validator";

// src/modules/job-cards/job-card.controller.ts
import { z as z11 } from "zod";

// src/modules/job-cards/job-card.service.ts
import { and as and5, asc as asc5, desc as desc5, eq as eq6, ilike as ilike5, or as or5, sql as sql6 } from "drizzle-orm";

// src/utils/sequence.ts
function generateDocumentNumber(prefix, sequence) {
  const now = /* @__PURE__ */ new Date();
  const yyyy = now.getFullYear().toString();
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  const dd = now.getDate().toString().padStart(2, "0");
  const seq = sequence.toString().padStart(4, "0");
  return `${prefix}-${yyyy}${mm}${dd}-${seq}`;
}

// src/modules/job-cards/job-card.service.ts
function cleanInput5(input) {
  const out = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === "") out[k] = null;
    else if (typeof v === "number") out[k] = v.toString();
    else out[k] = v;
  }
  return out;
}
async function generateJobNo() {
  const [{ count }] = await db.select({ count: sql6`count(*)::int` }).from(jobCards);
  return generateDocumentNumber("JOB", (count ?? 0) + 1);
}
var jobCardService = {
  async list(params) {
    const { page, limit, search, sortOrder, status, customerId } = params;
    const conditions = [];
    if (search) {
      conditions.push(
        or5(
          ilike5(jobCards.jobNo, `%${search}%`),
          ilike5(jobCards.complaint, `%${search}%`),
          ilike5(jobCards.diagnosis, `%${search}%`)
        )
      );
    }
    if (status) conditions.push(eq6(jobCards.status, status));
    if (customerId) conditions.push(eq6(jobCards.customerId, customerId));
    const where = conditions.length ? and5(...conditions) : void 0;
    const orderFn = sortOrder === "asc" ? asc5 : desc5;
    const [rows, totalRow] = await Promise.all([
      db.query.jobCards.findMany({
        where,
        with: { customer: true, vehicle: true, assignedTo: true, items: true },
        orderBy: [orderFn(jobCards.createdAt)],
        limit,
        offset: getOffset(page, limit)
      }),
      db.select({ count: sql6`count(*)::int` }).from(jobCards).where(where)
    ]);
    return { rows: rows.map(formatJobCard), total: totalRow[0]?.count ?? 0 };
  },
  async getById(id) {
    const jc = await db.query.jobCards.findFirst({
      where: eq6(jobCards.id, id),
      with: {
        customer: true,
        vehicle: true,
        assignedTo: { columns: { id: true, name: true, email: true, role: true } },
        items: { with: { part: true } },
        invoices: true
      }
    });
    if (!jc) throw new NotFoundError("\u099C\u09AC \u0995\u09BE\u09B0\u09CD\u09A1");
    return formatJobCard(jc);
  },
  async create(input) {
    const { items = [], ...rest } = input;
    const cleaned = cleanInput5(rest);
    const jobNo = await generateJobNo();
    const [created2] = await db.insert(jobCards).values({ ...cleaned, jobNo }).returning();
    if (items.length) {
      const itemRows = items.map((it) => ({
        jobCardId: created2.id,
        partId: it.partId || null,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice.toString(),
        total: (it.unitPrice * it.quantity).toString()
      }));
      await db.insert(jobCardItems).values(itemRows);
      for (const it of items) {
        if (it.partId) {
          const part = await db.query.parts.findFirst({ where: eq6(parts.id, it.partId) });
          if (part) {
            const newQty = Math.max(0, part.stockQty - it.quantity);
            await db.update(parts).set({ stockQty: newQty }).where(eq6(parts.id, it.partId));
          }
        }
      }
    }
    return this.getById(created2.id);
  },
  async update(id, input) {
    const { items, ...rest } = input;
    const cleaned = cleanInput5(rest);
    const [row] = await db.update(jobCards).set({ ...cleaned, updatedAt: /* @__PURE__ */ new Date() }).where(eq6(jobCards.id, id)).returning();
    if (!row) throw new NotFoundError("\u099C\u09AC \u0995\u09BE\u09B0\u09CD\u09A1");
    if (items) {
      const existing = await db.query.jobCardItems.findMany({
        where: eq6(jobCardItems.jobCardId, id)
      });
      for (const ex of existing) {
        if (ex.partId) {
          const part = await db.query.parts.findFirst({ where: eq6(parts.id, ex.partId) });
          if (part) {
            await db.update(parts).set({ stockQty: part.stockQty + ex.quantity }).where(eq6(parts.id, ex.partId));
          }
        }
      }
      await db.delete(jobCardItems).where(eq6(jobCardItems.jobCardId, id));
      if (items.length) {
        const itemRows = items.map((it) => ({
          jobCardId: id,
          partId: it.partId || null,
          name: it.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice.toString(),
          total: (it.unitPrice * it.quantity).toString()
        }));
        await db.insert(jobCardItems).values(itemRows);
        for (const it of items) {
          if (it.partId) {
            const part = await db.query.parts.findFirst({ where: eq6(parts.id, it.partId) });
            if (part) {
              const newQty = Math.max(0, part.stockQty - it.quantity);
              await db.update(parts).set({ stockQty: newQty }).where(eq6(parts.id, it.partId));
            }
          }
        }
      }
    }
    return this.getById(id);
  },
  async updateStatus(id, status) {
    const updates = { status, updatedAt: /* @__PURE__ */ new Date() };
    if (status === "delivered") {
      updates.deliveredDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    }
    const [row] = await db.update(jobCards).set(updates).where(eq6(jobCards.id, id)).returning();
    if (!row) throw new NotFoundError("\u099C\u09AC \u0995\u09BE\u09B0\u09CD\u09A1");
    return this.getById(id);
  },
  async delete(id) {
    const [row] = await db.delete(jobCards).where(eq6(jobCards.id, id)).returning();
    if (!row) throw new NotFoundError("\u099C\u09AC \u0995\u09BE\u09B0\u09CD\u09A1");
    return row;
  }
};
function formatJobCard(jc) {
  const items = jc.items ?? [];
  const partsTotal = items.reduce(
    (sum, it) => sum + Number(it.unitPrice) * it.quantity,
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
    total
  };
}

// src/modules/job-cards/job-card.schema.ts
import { z as z10 } from "zod";
var jobStatusValues = [
  "pending",
  "in_progress",
  "completed",
  "delivered",
  "cancelled"
];
var jobCardItemInputSchema = z10.object({
  partId: z10.string().uuid().optional().nullable(),
  name: z10.string().min(1, "\u09AA\u09BE\u09B0\u09CD\u099F\u09B8\u09C7\u09B0 \u09A8\u09BE\u09AE \u0986\u09AC\u09B6\u09CD\u09AF\u0995").max(200),
  quantity: z10.coerce.number().int().positive("\u09AA\u09B0\u09BF\u09AE\u09BE\u09A3 \u09E7 \u09AC\u09BE \u09A4\u09BE\u09B0 \u09AC\u09C7\u09B6\u09BF \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7"),
  unitPrice: z10.coerce.number().min(0, "\u09AE\u09C2\u09B2\u09CD\u09AF \u09E6 \u09AC\u09BE \u09A4\u09BE\u09B0 \u09AC\u09C7\u09B6\u09BF \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7")
});
var createJobCardSchema = z10.object({
  customerId: z10.string().uuid("\u09B8\u09A0\u09BF\u0995 \u0997\u09CD\u09B0\u09BE\u09B9\u0995 \u0986\u0987\u09A1\u09BF \u09A6\u09BF\u09A8"),
  vehicleId: z10.string().uuid("\u09B8\u09A0\u09BF\u0995 \u09AF\u09BE\u09A8\u09AC\u09BE\u09B9\u09A8 \u0986\u0987\u09A1\u09BF \u09A6\u09BF\u09A8"),
  assignedToId: z10.string().uuid().optional().nullable(),
  complaint: z10.string().max(2e3).optional().nullable(),
  diagnosis: z10.string().max(2e3).optional().nullable(),
  workDone: z10.string().max(2e3).optional().nullable(),
  mileageIn: z10.coerce.number().int().min(0).optional().nullable(),
  laborCost: z10.coerce.number().min(0).default(0),
  discount: z10.coerce.number().min(0).default(0),
  expectedDeliveryDate: z10.string().optional().nullable(),
  status: z10.enum(jobStatusValues).default("pending"),
  notes: z10.string().max(2e3).optional().nullable(),
  items: z10.array(jobCardItemInputSchema).default([])
});
var updateJobCardSchema = createJobCardSchema.partial();
var updateStatusSchema = z10.object({
  status: z10.enum(jobStatusValues)
});

// src/modules/job-cards/job-card.controller.ts
var listQuerySchema3 = paginationSchema.extend({
  status: z11.enum(jobStatusValues).optional(),
  customerId: z11.string().uuid().optional()
});
var jobCardController = {
  async list(c) {
    const params = listQuerySchema3.parse(c.req.query());
    const { rows, total } = await jobCardService.list(params);
    return paginated(c, rows, { page: params.page, limit: params.limit, total });
  },
  async get(c) {
    const data = await jobCardService.getById(c.req.param("id"));
    return success(c, data);
  },
  async create(c) {
    const body = await c.req.json();
    const data = await jobCardService.create(body);
    return created(c, data, "\u099C\u09AC \u0995\u09BE\u09B0\u09CD\u09A1 \u09B8\u09AB\u09B2\u09AD\u09BE\u09AC\u09C7 \u09A4\u09C8\u09B0\u09BF \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async update(c) {
    const body = await c.req.json();
    const data = await jobCardService.update(c.req.param("id"), body);
    return success(c, data, "\u099C\u09AC \u0995\u09BE\u09B0\u09CD\u09A1 \u0986\u09AA\u09A1\u09C7\u099F \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async updateStatus(c) {
    const body = await c.req.json();
    const data = await jobCardService.updateStatus(c.req.param("id"), body.status);
    return success(c, data, "\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u099F\u09BE\u09B8 \u09AA\u09B0\u09BF\u09AC\u09B0\u09CD\u09A4\u09A8 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async remove(c) {
    const id = c.req.param("id");
    await jobCardService.delete(id);
    return success(c, { id }, "\u099C\u09AC \u0995\u09BE\u09B0\u09CD\u09A1 \u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  }
};

// src/modules/job-cards/job-card.routes.ts
var jobCardRoutes = new Hono6();
jobCardRoutes.use("*", authMiddleware);
jobCardRoutes.get("/", jobCardController.list);
jobCardRoutes.get("/:id", jobCardController.get);
jobCardRoutes.post("/", zValidator6("json", createJobCardSchema), jobCardController.create);
jobCardRoutes.patch("/:id", zValidator6("json", updateJobCardSchema), jobCardController.update);
jobCardRoutes.patch(
  "/:id/status",
  zValidator6("json", updateStatusSchema),
  jobCardController.updateStatus
);
jobCardRoutes.delete("/:id", jobCardController.remove);
var job_card_routes_default = jobCardRoutes;

// src/modules/invoices/invoice.routes.ts
import { Hono as Hono7 } from "hono";
import { zValidator as zValidator7 } from "@hono/zod-validator";

// src/modules/invoices/invoice.controller.ts
import { z as z13 } from "zod";

// src/modules/invoices/invoice.service.ts
import { and as and6, asc as asc6, desc as desc6, eq as eq7, ilike as ilike6, sql as sql7 } from "drizzle-orm";
function toStr(n) {
  return n.toString();
}
async function generateInvoiceNo() {
  const [{ count }] = await db.select({ count: sql7`count(*)::int` }).from(invoices);
  return generateDocumentNumber("INV", (count ?? 0) + 1);
}
function computeStatus(total, paidAmount) {
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount >= total) return "paid";
  return "partial";
}
var invoiceService = {
  async list(params) {
    const { page, limit, search, sortOrder, status, customerId } = params;
    const conditions = [];
    if (search) conditions.push(ilike6(invoices.invoiceNo, `%${search}%`));
    if (status) conditions.push(eq7(invoices.status, status));
    if (customerId) conditions.push(eq7(invoices.customerId, customerId));
    const where = conditions.length ? and6(...conditions) : void 0;
    const orderFn = sortOrder === "asc" ? asc6 : desc6;
    const [rows, totalRow] = await Promise.all([
      db.query.invoices.findMany({
        where,
        with: {
          customer: true,
          jobCard: { with: { vehicle: true, items: true } },
          payments: true
        },
        orderBy: [orderFn(invoices.createdAt)],
        limit,
        offset: getOffset(page, limit)
      }),
      db.select({ count: sql7`count(*)::int` }).from(invoices).where(where)
    ]);
    return { rows, total: totalRow[0]?.count ?? 0 };
  },
  async getById(id) {
    const inv = await db.query.invoices.findFirst({
      where: eq7(invoices.id, id),
      with: {
        customer: true,
        jobCard: { with: { vehicle: true, items: { with: { part: true } } } },
        payments: true
      }
    });
    if (!inv) throw new NotFoundError("\u0987\u09A8\u09AD\u09AF\u09BC\u09C7\u09B8");
    return inv;
  },
  async create(input) {
    const invoiceNo = await generateInvoiceNo();
    const total = input.total;
    const dueAmount = total;
    const [row] = await db.insert(invoices).values({
      invoiceNo,
      customerId: input.customerId,
      jobCardId: input.jobCardId || null,
      issueDate: input.issueDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      dueDate: input.dueDate || null,
      subtotal: toStr(input.subtotal),
      discount: toStr(input.discount),
      tax: toStr(input.tax),
      total: toStr(total),
      paidAmount: "0",
      dueAmount: toStr(dueAmount),
      status: "unpaid",
      notes: input.notes ?? null
    }).returning();
    return this.getById(row.id);
  },
  async update(id, input) {
    const inv = await db.query.invoices.findFirst({ where: eq7(invoices.id, id) });
    if (!inv) throw new NotFoundError("\u0987\u09A8\u09AD\u09AF\u09BC\u09C7\u09B8");
    const data = { updatedAt: /* @__PURE__ */ new Date() };
    if (input.customerId) data.customerId = input.customerId;
    if (input.jobCardId !== void 0) data.jobCardId = input.jobCardId || null;
    if (input.issueDate) data.issueDate = input.issueDate;
    if (input.dueDate !== void 0) data.dueDate = input.dueDate || null;
    if (input.subtotal !== void 0) data.subtotal = toStr(input.subtotal);
    if (input.discount !== void 0) data.discount = toStr(input.discount);
    if (input.tax !== void 0) data.tax = toStr(input.tax);
    if (input.total !== void 0) {
      data.total = toStr(input.total);
      const paid = Number(inv.paidAmount);
      data.dueAmount = toStr(Math.max(0, input.total - paid));
      data.status = computeStatus(input.total, paid);
    }
    if (input.notes !== void 0) data.notes = input.notes;
    const [row] = await db.update(invoices).set(data).where(eq7(invoices.id, id)).returning();
    return this.getById(row.id);
  },
  async delete(id) {
    const [row] = await db.delete(invoices).where(eq7(invoices.id, id)).returning();
    if (!row) throw new NotFoundError("\u0987\u09A8\u09AD\u09AF\u09BC\u09C7\u09B8");
    return row;
  },
  async addPayment(invoiceId, input) {
    const inv = await db.query.invoices.findFirst({ where: eq7(invoices.id, invoiceId) });
    if (!inv) throw new NotFoundError("\u0987\u09A8\u09AD\u09AF\u09BC\u09C7\u09B8");
    if (inv.status === "cancelled") throw new BadRequestError("\u09AC\u09BE\u09A4\u09BF\u09B2 \u09B9\u0993\u09AF\u09BC\u09BE \u0987\u09A8\u09AD\u09AF\u09BC\u09C7\u09B8\u09C7 \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u0995\u09B0\u09BE \u09AF\u09BE\u09AC\u09C7 \u09A8\u09BE");
    const due = Number(inv.dueAmount);
    if (input.amount > due + 1e-3) {
      throw new BadRequestError(`\u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F\u09C7\u09B0 \u09AA\u09B0\u09BF\u09AE\u09BE\u09A3 \u09AC\u0995\u09C7\u09AF\u09BC\u09BE (${due}) \u098F\u09B0 \u099A\u09C7\u09AF\u09BC\u09C7 \u09AC\u09C7\u09B6\u09BF \u09B9\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7 \u09A8\u09BE`);
    }
    await db.insert(payments).values({
      invoiceId,
      amount: toStr(input.amount),
      method: input.method,
      transactionRef: input.transactionRef ?? null,
      paidAt: input.paidAt ? new Date(input.paidAt) : /* @__PURE__ */ new Date(),
      notes: input.notes ?? null
    });
    const newPaid = Number(inv.paidAmount) + input.amount;
    const newDue = Number(inv.total) - newPaid;
    await db.update(invoices).set({
      paidAmount: toStr(newPaid),
      dueAmount: toStr(Math.max(0, newDue)),
      status: computeStatus(Number(inv.total), newPaid),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq7(invoices.id, invoiceId));
    return this.getById(invoiceId);
  },
  async cancel(id) {
    const [row] = await db.update(invoices).set({ status: "cancelled", updatedAt: /* @__PURE__ */ new Date() }).where(eq7(invoices.id, id)).returning();
    if (!row) throw new NotFoundError("\u0987\u09A8\u09AD\u09AF\u09BC\u09C7\u09B8");
    return this.getById(id);
  }
};

// src/modules/invoices/invoice.schema.ts
import { z as z12 } from "zod";
var paymentMethodValues = [
  "cash",
  "bkash",
  "nagad",
  "rocket",
  "bank",
  "card",
  "other"
];
var invoiceStatusValues = [
  "draft",
  "unpaid",
  "partial",
  "paid",
  "cancelled"
];
var createInvoiceSchema = z12.object({
  customerId: z12.string().uuid("\u09B8\u09A0\u09BF\u0995 \u0997\u09CD\u09B0\u09BE\u09B9\u0995 \u0986\u0987\u09A1\u09BF \u09A6\u09BF\u09A8"),
  jobCardId: z12.string().uuid().optional().nullable(),
  issueDate: z12.string().optional(),
  dueDate: z12.string().optional().nullable(),
  subtotal: z12.coerce.number().min(0),
  discount: z12.coerce.number().min(0).default(0),
  tax: z12.coerce.number().min(0).default(0),
  total: z12.coerce.number().min(0),
  notes: z12.string().max(2e3).optional().nullable()
});
var updateInvoiceSchema = createInvoiceSchema.partial();
var createPaymentSchema = z12.object({
  amount: z12.coerce.number().positive("\u099F\u09BE\u0995\u09BE\u09B0 \u09AA\u09B0\u09BF\u09AE\u09BE\u09A3 \u09E6 \u098F\u09B0 \u09AC\u09C7\u09B6\u09BF \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7"),
  method: z12.enum(paymentMethodValues).default("cash"),
  transactionRef: z12.string().max(100).optional().nullable(),
  paidAt: z12.string().optional(),
  notes: z12.string().max(500).optional().nullable()
});

// src/modules/invoices/invoice.controller.ts
var listQuerySchema4 = paginationSchema.extend({
  status: z13.enum(invoiceStatusValues).optional(),
  customerId: z13.string().uuid().optional()
});
var invoiceController = {
  async list(c) {
    const params = listQuerySchema4.parse(c.req.query());
    const { rows, total } = await invoiceService.list(params);
    return paginated(c, rows, { page: params.page, limit: params.limit, total });
  },
  async get(c) {
    const data = await invoiceService.getById(c.req.param("id"));
    return success(c, data);
  },
  async create(c) {
    const body = await c.req.json();
    const data = await invoiceService.create(body);
    return created(c, data, "\u0987\u09A8\u09AD\u09AF\u09BC\u09C7\u09B8 \u09B8\u09AB\u09B2\u09AD\u09BE\u09AC\u09C7 \u09A4\u09C8\u09B0\u09BF \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async update(c) {
    const body = await c.req.json();
    const data = await invoiceService.update(c.req.param("id"), body);
    return success(c, data, "\u0987\u09A8\u09AD\u09AF\u09BC\u09C7\u09B8 \u0986\u09AA\u09A1\u09C7\u099F \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async remove(c) {
    const id = c.req.param("id");
    await invoiceService.delete(id);
    return success(c, { id }, "\u0987\u09A8\u09AD\u09AF\u09BC\u09C7\u09B8 \u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async addPayment(c) {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = await invoiceService.addPayment(id, body);
    return created(c, data, "\u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u0997\u09C3\u09B9\u09C0\u09A4 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async cancel(c) {
    const id = c.req.param("id");
    const data = await invoiceService.cancel(id);
    return success(c, data, "\u0987\u09A8\u09AD\u09AF\u09BC\u09C7\u09B8 \u09AC\u09BE\u09A4\u09BF\u09B2 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  }
};

// src/modules/invoices/invoice.routes.ts
var invoiceRoutes = new Hono7();
invoiceRoutes.use("*", authMiddleware);
invoiceRoutes.get("/", invoiceController.list);
invoiceRoutes.get("/:id", invoiceController.get);
invoiceRoutes.post("/", zValidator7("json", createInvoiceSchema), invoiceController.create);
invoiceRoutes.patch("/:id", zValidator7("json", updateInvoiceSchema), invoiceController.update);
invoiceRoutes.delete("/:id", invoiceController.remove);
invoiceRoutes.post(
  "/:id/payments",
  zValidator7("json", createPaymentSchema),
  invoiceController.addPayment
);
invoiceRoutes.post("/:id/cancel", invoiceController.cancel);
var invoice_routes_default = invoiceRoutes;

// src/modules/expenses/expense.routes.ts
import { Hono as Hono8 } from "hono";
import { zValidator as zValidator8 } from "@hono/zod-validator";

// src/modules/expenses/expense.controller.ts
import { z as z14 } from "zod";

// src/modules/expenses/expense.service.ts
import { and as and7, asc as asc7, desc as desc7, eq as eq8, ilike as ilike7, or as or7, sql as sql8, gte, lte } from "drizzle-orm";
function toStr2(n) {
  return n.toString();
}
var expenseService = {
  async list(params) {
    const { page, limit, search, sortOrder, category, from, to } = params;
    const conditions = [];
    if (search) {
      conditions.push(
        or7(ilike7(expenses.title, `%${search}%`), ilike7(expenses.notes, `%${search}%`))
      );
    }
    if (category) conditions.push(eq8(expenses.category, category));
    if (from) conditions.push(gte(expenses.expenseDate, from));
    if (to) conditions.push(lte(expenses.expenseDate, to));
    const where = conditions.length ? and7(...conditions) : void 0;
    const orderFn = sortOrder === "asc" ? asc7 : desc7;
    const [rows, totalRow] = await Promise.all([
      db.select().from(expenses).where(where).orderBy(orderFn(expenses.expenseDate)).limit(limit).offset(getOffset(page, limit)),
      db.select({ count: sql8`count(*)::int` }).from(expenses).where(where)
    ]);
    return { rows, total: totalRow[0]?.count ?? 0 };
  },
  async getById(id) {
    const exp = await db.query.expenses.findFirst({ where: eq8(expenses.id, id) });
    if (!exp) throw new NotFoundError("\u0996\u09B0\u099A");
    return exp;
  },
  async create(input) {
    const [row] = await db.insert(expenses).values({
      title: input.title,
      category: input.category,
      amount: toStr2(input.amount),
      expenseDate: input.expenseDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      paymentMethod: input.paymentMethod ?? null,
      notes: input.notes ?? null
    }).returning();
    return row;
  },
  async update(id, input) {
    const data = { updatedAt: /* @__PURE__ */ new Date() };
    if (input.title !== void 0) data.title = input.title;
    if (input.category !== void 0) data.category = input.category;
    if (input.amount !== void 0) data.amount = toStr2(input.amount);
    if (input.expenseDate !== void 0) data.expenseDate = input.expenseDate;
    if (input.paymentMethod !== void 0) data.paymentMethod = input.paymentMethod;
    if (input.notes !== void 0) data.notes = input.notes;
    const [row] = await db.update(expenses).set(data).where(eq8(expenses.id, id)).returning();
    if (!row) throw new NotFoundError("\u0996\u09B0\u099A");
    return row;
  },
  async delete(id) {
    const [row] = await db.delete(expenses).where(eq8(expenses.id, id)).returning();
    if (!row) throw new NotFoundError("\u0996\u09B0\u099A");
    return row;
  }
};

// src/modules/expenses/expense.controller.ts
var listQuerySchema5 = paginationSchema.extend({
  category: z14.string().optional(),
  from: z14.string().optional(),
  to: z14.string().optional()
});
var expenseController = {
  async list(c) {
    const params = listQuerySchema5.parse(c.req.query());
    const { rows, total } = await expenseService.list(params);
    return paginated(c, rows, { page: params.page, limit: params.limit, total });
  },
  async get(c) {
    const data = await expenseService.getById(c.req.param("id"));
    return success(c, data);
  },
  async create(c) {
    const body = await c.req.json();
    const data = await expenseService.create(body);
    return created(c, data, "\u0996\u09B0\u099A \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async update(c) {
    const body = await c.req.json();
    const data = await expenseService.update(c.req.param("id"), body);
    return success(c, data, "\u0996\u09B0\u099A \u0986\u09AA\u09A1\u09C7\u099F \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  },
  async remove(c) {
    const id = c.req.param("id");
    await expenseService.delete(id);
    return success(c, { id }, "\u0996\u09B0\u099A \u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7");
  }
};

// src/modules/expenses/expense.schema.ts
import { z as z15 } from "zod";
var createExpenseSchema = z15.object({
  title: z15.string().min(1, "\u09B6\u09BF\u09B0\u09CB\u09A8\u09BE\u09AE \u0986\u09AC\u09B6\u09CD\u09AF\u0995").max(200),
  category: z15.string().max(100).default("misc"),
  amount: z15.coerce.number().positive("\u099F\u09BE\u0995\u09BE\u09B0 \u09AA\u09B0\u09BF\u09AE\u09BE\u09A3 \u09E6 \u098F\u09B0 \u09AC\u09C7\u09B6\u09BF \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7"),
  expenseDate: z15.string().optional(),
  paymentMethod: z15.string().max(50).optional().nullable(),
  notes: z15.string().max(1e3).optional().nullable()
});
var updateExpenseSchema = createExpenseSchema.partial();

// src/modules/expenses/expense.routes.ts
var expenseRoutes = new Hono8();
expenseRoutes.use("*", authMiddleware);
expenseRoutes.get("/", expenseController.list);
expenseRoutes.get("/:id", expenseController.get);
expenseRoutes.post("/", zValidator8("json", createExpenseSchema), expenseController.create);
expenseRoutes.patch("/:id", zValidator8("json", updateExpenseSchema), expenseController.update);
expenseRoutes.delete("/:id", expenseController.remove);
var expense_routes_default = expenseRoutes;

// src/modules/dashboard/dashboard.routes.ts
import { Hono as Hono9 } from "hono";

// src/modules/dashboard/dashboard.service.ts
import { sql as sql9, gte as gte2, eq as eq9 } from "drizzle-orm";
function lastNDays(n) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}
var dashboardService = {
  async getStats() {
    const today3 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const startOfMonth3 = new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1).toISOString().split("T")[0];
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
      [totalDueRow]
    ] = await Promise.all([
      db.select({ c: sql9`count(*)::int` }).from(customers),
      db.select({ c: sql9`count(*)::int` }).from(vehicles),
      db.select({ c: sql9`count(*)::int` }).from(parts),
      db.select({ c: sql9`count(*)::int` }).from(parts).where(sql9`${parts.stockQty} <= ${parts.lowStockThreshold}`),
      db.select({ c: sql9`count(*)::int` }).from(jobCards).where(eq9(jobCards.status, "pending")),
      db.select({ c: sql9`count(*)::int` }).from(jobCards).where(eq9(jobCards.status, "in_progress")),
      db.select({ c: sql9`count(*)::int` }).from(jobCards).where(eq9(jobCards.status, "completed")),
      db.select({ total: sql9`coalesce(sum(${payments.amount}),0)::text` }).from(payments).where(sql9`date(${payments.paidAt}) = ${today3}`),
      db.select({ total: sql9`coalesce(sum(${payments.amount}),0)::text` }).from(payments).where(sql9`date(${payments.paidAt}) >= ${startOfMonth3}`),
      db.select({ total: sql9`coalesce(sum(${expenses.amount}),0)::text` }).from(expenses).where(eq9(expenses.expenseDate, today3)),
      db.select({ total: sql9`coalesce(sum(${expenses.amount}),0)::text` }).from(expenses).where(gte2(expenses.expenseDate, startOfMonth3)),
      db.select({ total: sql9`coalesce(sum(${invoices.dueAmount}),0)::text` }).from(invoices).where(sql9`${invoices.status} != 'cancelled'`)
    ]);
    return {
      counts: {
        customers: customerCount.c,
        vehicles: vehicleCount.c,
        parts: partsCount.c,
        lowStock: lowStockCount.c,
        pendingJobs: pendingJobs.c,
        inProgressJobs: inProgressJobs.c,
        completedJobs: completedJobs.c
      },
      finance: {
        todayRevenue: Number(todayRevenueRow.total),
        monthRevenue: Number(monthRevenueRow.total),
        todayExpense: Number(todayExpenseRow.total),
        monthExpense: Number(monthExpenseRow.total),
        totalDue: Number(totalDueRow.total)
      }
    };
  },
  async getRevenueSeries(days = 14) {
    const start = lastNDays(days - 1);
    const rows = await db.select({
      date: sql9`to_char(${payments.paidAt}::date, 'YYYY-MM-DD')`,
      total: sql9`coalesce(sum(${payments.amount}),0)::text`
    }).from(payments).where(sql9`${payments.paidAt}::date >= ${start}`).groupBy(sql9`${payments.paidAt}::date`).orderBy(sql9`${payments.paidAt}::date`);
    const map = new Map(rows.map((r) => [r.date, Number(r.total)]));
    const series = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      series.push({ date: key, total: map.get(key) ?? 0 });
    }
    return series;
  },
  async getRecentJobs(limit = 5) {
    return await db.query.jobCards.findMany({
      with: { customer: true, vehicle: true },
      orderBy: (j, { desc: desc8 }) => [desc8(j.createdAt)],
      limit
    });
  },
  async getLowStockParts(limit = 5) {
    return await db.query.parts.findMany({
      where: sql9`${parts.stockQty} <= ${parts.lowStockThreshold}`,
      orderBy: (p, { asc: asc8 }) => [asc8(p.stockQty)],
      limit
    });
  }
};

// src/modules/dashboard/dashboard.controller.ts
var dashboardController = {
  async overview(c) {
    const [stats, revenueSeries, recentJobs, lowStock] = await Promise.all([
      dashboardService.getStats(),
      dashboardService.getRevenueSeries(14),
      dashboardService.getRecentJobs(5),
      dashboardService.getLowStockParts(5)
    ]);
    return success(c, { ...stats, revenueSeries, recentJobs, lowStock });
  }
};

// src/modules/dashboard/dashboard.routes.ts
var dashboardRoutes = new Hono9();
dashboardRoutes.use("*", authMiddleware);
dashboardRoutes.get("/overview", dashboardController.overview);
var dashboard_routes_default = dashboardRoutes;

// src/modules/reports/report.routes.ts
import { Hono as Hono10 } from "hono";

// src/modules/reports/report.controller.ts
import { z as z16 } from "zod";

// src/modules/reports/report.service.ts
import { sql as sql10, gte as gte3, lte as lte3, and as and9 } from "drizzle-orm";
function startOfMonth() {
  const d = /* @__PURE__ */ new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}
function today() {
  return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
}
var reportService = {
  async summary(from, to) {
    const start = from || startOfMonth();
    const end = to || today();
    const [revenueRow, expenseRow, dueRow, invoiceCountRow] = await Promise.all([
      db.select({ total: sql10`coalesce(sum(${payments.amount}),0)::text` }).from(payments).where(
        and9(
          sql10`${payments.paidAt}::date >= ${start}`,
          sql10`${payments.paidAt}::date <= ${end}`
        )
      ),
      db.select({ total: sql10`coalesce(sum(${expenses.amount}),0)::text` }).from(expenses).where(and9(gte3(expenses.expenseDate, start), lte3(expenses.expenseDate, end))),
      db.select({ total: sql10`coalesce(sum(${invoices.dueAmount}),0)::text` }).from(invoices).where(sql10`${invoices.status} != 'cancelled'`),
      db.select({ count: sql10`count(*)::int` }).from(invoices).where(
        and9(
          gte3(invoices.issueDate, start),
          lte3(invoices.issueDate, end),
          sql10`${invoices.status} != 'cancelled'`
        )
      )
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
      invoiceCount
    };
  },
  async revenueSeries(from, to) {
    const rows = await db.select({
      date: sql10`to_char(${payments.paidAt}::date, 'YYYY-MM-DD')`,
      total: sql10`coalesce(sum(${payments.amount}),0)::text`
    }).from(payments).where(
      and9(
        sql10`${payments.paidAt}::date >= ${from}`,
        sql10`${payments.paidAt}::date <= ${to}`
      )
    ).groupBy(sql10`${payments.paidAt}::date`).orderBy(sql10`${payments.paidAt}::date`);
    return rows.map((r) => ({ date: r.date, total: Number(r.total) }));
  },
  async topCustomers(from, to, limit = 5) {
    const rows = await db.execute(sql10`
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
    return rows.rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      phone: String(r.phone),
      paid: Number(r.paid),
      invoiceCount: Number(r.invoice_count)
    }));
  },
  async topParts(from, to, limit = 5) {
    const rows = await db.execute(sql10`
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
    return rows.rows.map((r) => ({
      name: String(r.name),
      qty: Number(r.qty),
      revenue: Number(r.revenue)
    }));
  }
};

// src/modules/reports/report.controller.ts
var rangeSchema = z16.object({
  from: z16.string().optional(),
  to: z16.string().optional()
});
function startOfMonth2() {
  const d = /* @__PURE__ */ new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}
function today2() {
  return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
}
var reportController = {
  async overview(c) {
    const params = rangeSchema.parse(c.req.query());
    const from = params.from || startOfMonth2();
    const to = params.to || today2();
    const [summary, revenueSeries, topCustomers, topParts] = await Promise.all([
      reportService.summary(from, to),
      reportService.revenueSeries(from, to),
      reportService.topCustomers(from, to, 5),
      reportService.topParts(from, to, 5)
    ]);
    return success(c, { summary, revenueSeries, topCustomers, topParts });
  }
};

// src/modules/reports/report.routes.ts
var reportRoutes = new Hono10();
reportRoutes.use("*", authMiddleware);
reportRoutes.get("/overview", reportController.overview);
var report_routes_default = reportRoutes;

// src/app.ts
var app = new Hono11();
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
  })
);
app.get(
  "/",
  (c) => c.json({
    name: "e-Hiseb API",
    nameBn: "\u0987-\u09B9\u09BF\u09B8\u09C7\u09AC \u098F\u09AA\u09BF\u0986\u0987",
    version: "1.0.0",
    description: "Workshop Management System for Bangladeshi shops",
    status: "ok"
  })
);
app.get("/health", (c) => c.json({ status: "healthy", time: (/* @__PURE__ */ new Date()).toISOString() }));
app.get("/api/health", (c) => c.json({ status: "healthy", time: (/* @__PURE__ */ new Date()).toISOString() }));
var api = new Hono11();
api.route("/auth", auth_routes_default);
api.route("/customers", customer_routes_default);
api.route("/vehicles", vehicle_routes_default);
api.route("/parts", part_routes_default);
api.route("/suppliers", supplier_routes_default);
api.route("/job-cards", job_card_routes_default);
api.route("/invoices", invoice_routes_default);
api.route("/expenses", expense_routes_default);
api.route("/dashboard", dashboard_routes_default);
api.route("/reports", report_routes_default);
app.route("/api/v1", api);
app.notFound(
  (c) => c.json(
    { success: false, error: { code: "NOT_FOUND", message: "Route not found" } },
    404
  )
);
app.onError(errorHandler);

// api/vercel-entry.ts
var handler = handle(app);
var GET = handler;
var POST = handler;
var PATCH = handler;
var PUT = handler;
var DELETE = handler;
var OPTIONS = handler;
var vercel_entry_default = handler;
export {
  DELETE,
  GET,
  OPTIONS,
  PATCH,
  POST,
  PUT,
  vercel_entry_default as default
};
