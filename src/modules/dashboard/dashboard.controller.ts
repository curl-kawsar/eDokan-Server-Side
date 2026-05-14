import type { Context } from "hono";
import { dashboardService } from "./dashboard.service";
import { success } from "@/utils/response";

export const dashboardController = {
  async overview(c: Context) {
    const [stats, revenueSeries, recentJobs, lowStock] = await Promise.all([
      dashboardService.getStats(),
      dashboardService.getRevenueSeries(14),
      dashboardService.getRecentJobs(5),
      dashboardService.getLowStockParts(5),
    ]);
    return success(c, { ...stats, revenueSeries, recentJobs, lowStock });
  },
};
