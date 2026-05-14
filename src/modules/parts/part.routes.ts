import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { partController } from "./part.controller";
import { createPartSchema, stockAdjustmentSchema, updatePartSchema } from "./part.schema";
import { authMiddleware } from "@/middlewares/auth";

const partRoutes = new Hono();
partRoutes.use("*", authMiddleware);

partRoutes.get("/", partController.list);
partRoutes.get("/:id", partController.get);
partRoutes.post("/", zValidator("json", createPartSchema), partController.create);
partRoutes.patch("/:id", zValidator("json", updatePartSchema), partController.update);
partRoutes.delete("/:id", partController.remove);
partRoutes.post(
  "/:id/stock-adjustment",
  zValidator("json", stockAdjustmentSchema),
  partController.adjustStock
);

export default partRoutes;
