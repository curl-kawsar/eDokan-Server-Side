import { Hono } from "hono";
import { dashboardController } from "./dashboard.controller";
import { authMiddleware } from "@/middlewares/auth";

const dashboardRoutes = new Hono();
dashboardRoutes.use("*", authMiddleware);

dashboardRoutes.get("/overview", dashboardController.overview);

export default dashboardRoutes;
