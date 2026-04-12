import useSWR from "swr";
import { fetcher } from "../_fetcher";
import { ModuleCounts, NotificationsResponse } from "../_types";

export const useNotifications = (params?: {
  unread?: boolean;
  page?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.unread) qs.set("unread", "true");
  if (params?.page) qs.set("page", String(params.page));

  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    `/api/admin/notifications?${qs}`,
    fetcher,
    { refreshInterval: 60_000 }, // poll every 60s
  );

  return { data, error, isLoading, mutate };
};

export const useModuleCounts = () => {
  const { data, error, isLoading, mutate } = useSWR<ModuleCounts>(
    "/api/admin/notifications/module-counts",
    fetcher,
    { refreshInterval: 120_000 }, // refresh every 2 min
  );

  return { data, error, isLoading, mutate };
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const markNotificationRead = async (id: string): Promise<void> => {
  await fetch(`/api/admin/notifications/${id}/read`, { method: "PATCH" });
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await fetch("/api/admin/notifications/read-all", { method: "POST" });
};
