import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { customerController } from "./customer.controller";
import { createCustomerSchema, updateCustomerSchema } from "./customer.schema";
import { authMiddleware } from "@/middlewares/auth";

const customerRoutes = new Hono();
customerRoutes.use("*", authMiddleware);

customerRoutes.get("/", customerController.list);
customerRoutes.get("/:id", customerController.get);
customerRoutes.post("/", zValidator("json", createCustomerSchema), customerController.create);
customerRoutes.patch("/:id", zValidator("json", updateCustomerSchema), customerController.update);
customerRoutes.delete("/:id", customerController.remove);

export default customerRoutes;
