import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { supplierController } from "./supplier.controller";
import { createSupplierSchema, updateSupplierSchema } from "./supplier.schema";
import { authMiddleware } from "@/middlewares/auth";

const supplierRoutes = new Hono();
supplierRoutes.use("*", authMiddleware);

supplierRoutes.get("/", supplierController.list);
supplierRoutes.get("/:id", supplierController.get);
supplierRoutes.post("/", zValidator("json", createSupplierSchema), supplierController.create);
supplierRoutes.patch("/:id", zValidator("json", updateSupplierSchema), supplierController.update);
supplierRoutes.delete("/:id", supplierController.remove);

export default supplierRoutes;
