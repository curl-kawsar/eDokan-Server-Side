import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { jobCardController } from "./job-card.controller";
import {
  createJobCardSchema,
  updateJobCardSchema,
  updateStatusSchema,
} from "./job-card.schema";
import { authMiddleware } from "@/middlewares/auth";

const jobCardRoutes = new Hono();
jobCardRoutes.use("*", authMiddleware);

jobCardRoutes.get("/", jobCardController.list);
jobCardRoutes.get("/:id", jobCardController.get);
jobCardRoutes.post("/", zValidator("json", createJobCardSchema), jobCardController.create);
jobCardRoutes.patch("/:id", zValidator("json", updateJobCardSchema), jobCardController.update);
jobCardRoutes.patch(
  "/:id/status",
  zValidator("json", updateStatusSchema),
  jobCardController.updateStatus
);
jobCardRoutes.delete("/:id", jobCardController.remove);

export default jobCardRoutes;
