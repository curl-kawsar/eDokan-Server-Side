import type { Context } from "hono";
import { z } from "zod";
import { reportService } from "./report.service";
import { success } from "@/utils/response";

const rangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]!;
}

function today() {
  return new Date().toISOString().split("T")[0]!;
}

export const reportController = {
  async overview(c: Context) {
    const params = rangeSchema.parse(c.req.query());
    const from = params.from || startOfMonth();
    const to = params.to || today();

    const [summary, revenueSeries, topCustomers, topParts] = await Promise.all([
      reportService.summary(from, to),
      reportService.revenueSeries(from, to),
      reportService.topCustomers(from, to, 5),
      reportService.topParts(from, to, 5),
    ]);

    return success(c, { summary, revenueSeries, topCustomers, topParts });
  },
};
