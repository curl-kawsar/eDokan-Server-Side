import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { expenseController } from "./expense.controller";
import { createExpenseSchema, updateExpenseSchema } from "./expense.schema";
import { authMiddleware } from "@/middlewares/auth";

const expenseRoutes = new Hono();
expenseRoutes.use("*", authMiddleware);

expenseRoutes.get("/", expenseController.list);
expenseRoutes.get("/:id", expenseController.get);
expenseRoutes.post("/", zValidator("json", createExpenseSchema), expenseController.create);
expenseRoutes.patch("/:id", zValidator("json", updateExpenseSchema), expenseController.update);
expenseRoutes.delete("/:id", expenseController.remove);

export default expenseRoutes;
