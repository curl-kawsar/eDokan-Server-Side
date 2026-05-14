import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { vehicleController } from "./vehicle.controller";
import { createVehicleSchema, updateVehicleSchema } from "./vehicle.schema";
import { authMiddleware } from "@/middlewares/auth";

const vehicleRoutes = new Hono();
vehicleRoutes.use("*", authMiddleware);

vehicleRoutes.get("/", vehicleController.list);
vehicleRoutes.get("/:id", vehicleController.get);
vehicleRoutes.post("/", zValidator("json", createVehicleSchema), vehicleController.create);
vehicleRoutes.patch("/:id", zValidator("json", updateVehicleSchema), vehicleController.update);
vehicleRoutes.delete("/:id", vehicleController.remove);

export default vehicleRoutes;
