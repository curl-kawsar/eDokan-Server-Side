import { Hono } from "hono";
import { reportController } from "./report.controller";
import { authMiddleware } from "@/middlewares/auth";

const reportRoutes = new Hono();
reportRoutes.use("*", authMiddleware);

reportRoutes.get("/overview", reportController.overview);

export default reportRoutes;
