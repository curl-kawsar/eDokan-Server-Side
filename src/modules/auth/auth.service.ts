import { eq } from "drizzle-orm";
import { db } from "@/config/db";
import { users } from "@/db/schema/users";
import { hashPassword, verifyPassword } from "@/utils/password";
import { signToken } from "@/utils/jwt";
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from "@/utils/errors";
import type {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from "./auth.schema";

export const authService = {
  async register(input: RegisterInput) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });
    if (existing) throw new ConflictError("এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হয়েছে");

    const passwordHash = await hashPassword(input.password);
    const [user] = await db
      .insert(users)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: input.role,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return { user, token };
  },

  async login(input: LoginInput) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });
    if (!user) throw new UnauthorizedError("ভুল ইমেইল বা পাসওয়ার্ড");
    if (!user.isActive) throw new UnauthorizedError("আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে");

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError("ভুল ইমেইল বা পাসওয়ার্ড");

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, token };
  },

  async getCurrentUser(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundError("User");
    return user;
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) data.name = input.name;
    if (input.phone !== undefined) data.phone = input.phone || null;

    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });
    if (!user) throw new NotFoundError("User");
    return user;
  },

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) throw new NotFoundError("User");

    const ok = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestError("বর্তমান পাসওয়ার্ড সঠিক নয়");

    const passwordHash = await hashPassword(input.newPassword);
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return { success: true };
  },
};
