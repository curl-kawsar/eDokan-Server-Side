import { z } from "zod";

export const vehicleTypeValues = [
  "motorcycle",
  "car",
  "truck",
  "cng",
  "rickshaw",
  "bus",
  "microbus",
  "pickup",
  "other",
] as const;

export const createVehicleSchema = z.object({
  customerId: z.string().uuid("সঠিক গ্রাহক আইডি দিন"),
  type: z.enum(vehicleTypeValues).default("motorcycle"),
  brand: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  registrationNo: z.string().min(1, "রেজিস্ট্রেশন নম্বর আবশ্যক").max(50),
  chassisNo: z.string().max(100).optional().nullable(),
  engineNo: z.string().max(100).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  yearOfMake: z.coerce.number().int().min(1950).max(2100).optional().nullable(),
  mileage: z.coerce.number().int().min(0).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
