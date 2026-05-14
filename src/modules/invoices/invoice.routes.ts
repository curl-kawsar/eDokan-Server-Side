import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { invoiceController } from "./invoice.controller";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  createPaymentSchema,
} from "./invoice.schema";
import { authMiddleware } from "@/middlewares/auth";

const invoiceRoutes = new Hono();
invoiceRoutes.use("*", authMiddleware);

invoiceRoutes.get("/", invoiceController.list);
invoiceRoutes.get("/:id", invoiceController.get);
invoiceRoutes.post("/", zValidator("json", createInvoiceSchema), invoiceController.create);
invoiceRoutes.patch("/:id", zValidator("json", updateInvoiceSchema), invoiceController.update);
invoiceRoutes.delete("/:id", invoiceController.remove);
invoiceRoutes.post(
  "/:id/payments",
  zValidator("json", createPaymentSchema),
  invoiceController.addPayment
);
invoiceRoutes.post("/:id/cancel", invoiceController.cancel);

export default invoiceRoutes;
