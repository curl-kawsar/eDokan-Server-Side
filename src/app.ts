import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { env } from "@/config/env";
import { errorHandler } from "@/middlewares/error";
import authRoutes from "@/modules/auth/auth.routes";
import customerRoutes from "@/modules/customers/customer.routes";
import vehicleRoutes from "@/modules/vehicles/vehicle.routes";
import partRoutes from "@/modules/parts/part.routes";
import supplierRoutes from "@/modules/suppliers/supplier.routes";
import jobCardRoutes from "@/modules/job-cards/job-card.routes";
import invoiceRoutes from "@/modules/invoices/invoice.routes";
import expenseRoutes from "@/modules/expenses/expense.routes";
import dashboardRoutes from "@/modules/dashboard/dashboard.routes";
import reportRoutes from "@/modules/reports/report.routes";

export const app = new Hono();

app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  })
);

app.get("/", (c) =>
  c.json({
    name: "e-Hiseb API",
    nameBn: "ই-হিসেব এপিআই",
    version: "1.0.0",
    description: "Workshop Management System for Bangladeshi shops",
    status: "ok",
  })
);

app.get("/health", (c) => c.json({ status: "healthy", time: new Date().toISOString() }));

const api = new Hono();
api.route("/auth", authRoutes);
api.route("/customers", customerRoutes);
api.route("/vehicles", vehicleRoutes);
api.route("/parts", partRoutes);
api.route("/suppliers", supplierRoutes);
api.route("/job-cards", jobCardRoutes);
api.route("/invoices", invoiceRoutes);
api.route("/expenses", expenseRoutes);
api.route("/dashboard", dashboardRoutes);
api.route("/reports", reportRoutes);

app.route("/api/v1", api);

app.notFound((c) =>
  c.json(
    { success: false, error: { code: "NOT_FOUND", message: "Route not found" } },
    404
  )
);

app.onError(errorHandler);
