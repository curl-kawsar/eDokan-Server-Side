import { z } from "zod";

export const createExpenseSchema = z.object({
  title: z.string().min(1, "শিরোনাম আবশ্যক").max(200),
  category: z.string().max(100).default("misc"),
  amount: z.coerce.number().positive("টাকার পরিমাণ ০ এর বেশি হতে হবে"),
  expenseDate: z.string().optional(),
  paymentMethod: z.string().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
