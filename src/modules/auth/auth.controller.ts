import type { Context } from "hono";
import { authService } from "./auth.service";
import { success, created } from "@/utils/response";
import type {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from "./auth.schema";

export const authController = {
  async register(c: Context) {
    const body = (await c.req.json()) as RegisterInput;
    const result = await authService.register(body);
    return created(c, result, "নিবন্ধন সফল হয়েছে");
  },

  async login(c: Context) {
    const body = (await c.req.json()) as LoginInput;
    const result = await authService.login(body);
    return success(c, result, "লগইন সফল হয়েছে");
  },

  async me(c: Context) {
    const user = c.get("user");
    const result = await authService.getCurrentUser(user.sub);
    return success(c, result);
  },

  async updateProfile(c: Context) {
    const user = c.get("user");
    const body = (await c.req.json()) as UpdateProfileInput;
    const result = await authService.updateProfile(user.sub, body);
    return success(c, result, "প্রোফাইল আপডেট হয়েছে");
  },

  async changePassword(c: Context) {
    const user = c.get("user");
    const body = (await c.req.json()) as ChangePasswordInput;
    const result = await authService.changePassword(user.sub, body);
    return success(c, result, "পাসওয়ার্ড পরিবর্তন হয়েছে");
  },
};
