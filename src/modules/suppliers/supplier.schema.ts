import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().min(1, "নাম আবশ্যক").max(200),
  contactPerson: z.string().max(200).optional().nullable(),
  phone: z.string().min(6, "সঠিক ফোন নম্বর দিন").max(20),
  altPhone: z.string().max(20).optional().nullable(),
  email: z.string().email("সঠিক ইমেইল দিন").optional().nullable().or(z.literal("")),
  address: z.string().max(500).optional().nullable(),
  openingBalance: z.coerce.number().default(0),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
