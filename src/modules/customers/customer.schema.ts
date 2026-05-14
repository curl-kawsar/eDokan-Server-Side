import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1, "নাম আবশ্যক").max(200),
  phone: z.string().min(6, "সঠিক ফোন নম্বর দিন").max(20),
  altPhone: z.string().max(20).optional().nullable(),
  email: z.string().email("সঠিক ইমেইল দিন").optional().nullable().or(z.literal("")),
  address: z.string().max(500).optional().nullable(),
  nidNumber: z.string().max(30).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
