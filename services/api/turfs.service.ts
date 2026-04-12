import useSWR from "swr";
import { AdminTurfRow, PaginatedTurfs, TurfSurface } from "../_types";
import { fetcher } from "../_fetcher";

export const useTurfs = (params?: {
  q?: string;
  page?: number;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const { data, error, isLoading, mutate, isValidating } =
    useSWR<PaginatedTurfs>(`/api/admin/turfs?${qs}`, fetcher);
  return { data, error, isLoading, mutate, isValidating };
};

export const useTurf = (id: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<AdminTurfRow>(
    id ? `/api/admin/turfs/${id}` : null,
    fetcher,
  );
  return { data, error, isLoading, mutate };
};

export const createTurf = async (payload: {
  name: string;
  city: string;
  area?: string;
  address?: string;
  surface?: TurfSurface;
  amenities?: string[];
  pricePerHour?: string;
  capacity?: number;
  agentId?: string;
}): Promise<{ message: string }> => {
  const res = await fetch("/api/admin/turfs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const updateTurf = async (
  id: string,
  payload: Partial<AdminTurfRow>,
): Promise<{ message: string }> => {
  const res = await fetch(`/api/admin/turfs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const deactivateTurf = async (
  id: string,
): Promise<{ message: string }> => {
  const res = await fetch(`/api/admin/turfs/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};
