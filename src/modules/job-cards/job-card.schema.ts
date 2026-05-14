import { z } from "zod";

export const jobStatusValues = [
  "pending",
  "in_progress",
  "completed",
  "delivered",
  "cancelled",
] as const;

export const jobCardItemInputSchema = z.object({
  partId: z.string().uuid().optional().nullable(),
  name: z.string().min(1, "পার্টসের নাম আবশ্যক").max(200),
  quantity: z.coerce.number().int().positive("পরিমাণ ১ বা তার বেশি হতে হবে"),
  unitPrice: z.coerce.number().min(0, "মূল্য ০ বা তার বেশি হতে হবে"),
});

export const createJobCardSchema = z.object({
  customerId: z.string().uuid("সঠিক গ্রাহক আইডি দিন"),
  vehicleId: z.string().uuid("সঠিক যানবাহন আইডি দিন"),
  assignedToId: z.string().uuid().optional().nullable(),
  complaint: z.string().max(2000).optional().nullable(),
  diagnosis: z.string().max(2000).optional().nullable(),
  workDone: z.string().max(2000).optional().nullable(),
  mileageIn: z.coerce.number().int().min(0).optional().nullable(),
  laborCost: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  expectedDeliveryDate: z.string().optional().nullable(),
  status: z.enum(jobStatusValues).default("pending"),
  notes: z.string().max(2000).optional().nullable(),
  items: z.array(jobCardItemInputSchema).default([]),
});

export const updateJobCardSchema = createJobCardSchema.partial();

export const updateStatusSchema = z.object({
  status: z.enum(jobStatusValues),
});

export type CreateJobCardInput = z.infer<typeof createJobCardSchema>;
export type UpdateJobCardInput = z.infer<typeof updateJobCardSchema>;
export type JobCardItemInput = z.infer<typeof jobCardItemInputSchema>;
