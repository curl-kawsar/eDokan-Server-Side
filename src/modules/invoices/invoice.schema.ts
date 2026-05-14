import { z } from "zod";

export const paymentMethodValues = [
  "cash",
  "bkash",
  "nagad",
  "rocket",
  "bank",
  "card",
  "other",
] as const;

export const invoiceStatusValues = [
  "draft",
  "unpaid",
  "partial",
  "paid",
  "cancelled",
] as const;

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid("সঠিক গ্রাহক আইডি দিন"),
  jobCardId: z.string().uuid().optional().nullable(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  subtotal: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const createPaymentSchema = z.object({
  amount: z.coerce.number().positive("টাকার পরিমাণ ০ এর বেশি হতে হবে"),
  method: z.enum(paymentMethodValues).default("cash"),
  transactionRef: z.string().max(100).optional().nullable(),
  paidAt: z.string().optional(),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
