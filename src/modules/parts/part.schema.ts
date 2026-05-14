import { z } from "zod";

export const createPartSchema = z.object({
  sku: z.string().min(1, "SKU আবশ্যক").max(50),
  name: z.string().min(1, "নাম আবশ্যক").max(200),
  nameBn: z.string().max(200).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  unit: z.string().max(20).default("pcs"),
  purchasePrice: z.coerce.number().min(0).default(0),
  sellingPrice: z.coerce.number().min(0).default(0),
  stockQty: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  supplierId: z.string().uuid().optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
});

export const updatePartSchema = createPartSchema.partial();

export const stockAdjustmentSchema = z.object({
  quantity: z.coerce.number().int(),
  reason: z.string().optional(),
});

export type CreatePartInput = z.infer<typeof createPartSchema>;
export type UpdatePartInput = z.infer<typeof updatePartSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
