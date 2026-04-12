import useSWR from "swr";
import { fetcher } from "../_fetcher";
import { SystemLogsResponse } from "../_types";

export const useSystemLogs = (params?: {
  q?: string;
  actorType?: string;
  entityType?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.actorType) qs.set("actorType", params.actorType);
  if (params?.entityType) qs.set("entityType", params.entityType);
  if (params?.action) qs.set("action", params.action);
  if (params?.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params?.dateTo) qs.set("dateTo", params.dateTo);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));

  const { data, error, isLoading, mutate, isValidating } =
    useSWR<SystemLogsResponse>(
      `/api/admin/system-logs?${qs.toString()}`,
      fetcher,
    );

  return { data, error, isLoading, mutate, isValidating };
};
