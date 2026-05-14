import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authController } from "./auth.controller";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "./auth.schema";
import { authMiddleware } from "@/middlewares/auth";

const authRoutes = new Hono();

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

export default authRoutes;
