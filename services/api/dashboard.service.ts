import useSWR from "swr";
import { fetcher } from "../_fetcher";
import { DashboardData } from "../_types";

export const useDashboard = () => {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    "/api/admin/dashboard",
    fetcher,
    { refreshInterval: 5 * 60 * 1000 }, // refresh every 5 min
  );
  return { data, error, isLoading, mutate };
};
